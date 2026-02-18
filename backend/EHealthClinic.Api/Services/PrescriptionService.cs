using EHealthClinic.Api.Data;
using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Services;

public sealed class PrescriptionService : IPrescriptionService
{
    private readonly ApplicationDbContext _db;

    public PrescriptionService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<PrescriptionResponse>> GetAllAsync(Guid? patientId = null, Guid? doctorId = null)
    {
        var q = _db.Prescriptions
            .Include(p => p.Doctor).ThenInclude(d => d.User)
            .Include(p => p.Patient).ThenInclude(p => p.User)
            .Include(p => p.Items)
            .AsQueryable();

        if (patientId.HasValue) q = q.Where(p => p.PatientId == patientId.Value);
        if (doctorId.HasValue) q = q.Where(p => p.DoctorId == doctorId.Value);

        return await q.OrderByDescending(p => p.IssuedAtUtc).Select(p => ToResponse(p)).ToListAsync();
    }

    public async Task<PrescriptionResponse?> GetByIdAsync(Guid id)
    {
        var p = await _db.Prescriptions
            .Include(p => p.Doctor).ThenInclude(d => d.User)
            .Include(p => p.Patient).ThenInclude(p => p.User)
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == id);
        return p is null ? null : ToResponse(p);
    }

    public async Task<PrescriptionResponse> CreateAsync(CreatePrescriptionRequest request)
    {
        var prescription = new Prescription
        {
            Id = Guid.NewGuid(),
            AppointmentId = request.AppointmentId,
            DoctorId = request.DoctorId,
            PatientId = request.PatientId,
            Notes = request.Notes,
            ExpiresAtUtc = request.ExpiresAtUtc,
            Status = "Active",
            IssuedAtUtc = DateTime.UtcNow,
            Items = request.Items.Select(i => new PrescriptionItem
            {
                Id = Guid.NewGuid(),
                MedicationName = i.MedicationName,
                Dosage = i.Dosage,
                Frequency = i.Frequency,
                DurationDays = i.DurationDays,
                Instructions = i.Instructions,
                Quantity = i.Quantity
            }).ToList()
        };

        _db.Prescriptions.Add(prescription);
        await _db.SaveChangesAsync();

        return (await GetByIdAsync(prescription.Id))!;
    }

    public async Task<PrescriptionResponse?> UpdateStatusAsync(Guid id, string status)
    {
        var p = await _db.Prescriptions.FindAsync(id);
        if (p is null) return null;
        p.Status = status;
        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    private static PrescriptionResponse ToResponse(Prescription p) =>
        new(p.Id, p.AppointmentId,
            p.DoctorId, p.Doctor?.User?.FullName ?? "",
            p.PatientId, p.Patient?.User?.FullName ?? "", p.Patient?.MRN,
            p.Status, p.Notes, p.IssuedAtUtc, p.ExpiresAtUtc,
            p.Items.Select(i => new PrescriptionItemResponse(i.Id, i.MedicationName, i.Dosage, i.Frequency, i.DurationDays, i.Instructions, i.Quantity)).ToList());
}
