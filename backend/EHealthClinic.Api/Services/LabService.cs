using EHealthClinic.Api.Data;
using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Services;

public sealed class LabService : ILabService
{
    private readonly ApplicationDbContext _db;

    public LabService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<LabOrderResponse>> GetOrdersAsync(Guid? patientId = null, Guid? doctorId = null, string? status = null)
    {
        var q = _db.LabOrders
            .Include(o => o.Doctor).ThenInclude(d => d.User)
            .Include(o => o.Patient).ThenInclude(p => p.User)
            .Include(o => o.Tests)
            .Include(o => o.Results).ThenInclude(r => r.LabOrderTest)
            .AsQueryable();

        if (patientId.HasValue) q = q.Where(o => o.PatientId == patientId.Value);
        if (doctorId.HasValue) q = q.Where(o => o.DoctorId == doctorId.Value);
        if (!string.IsNullOrEmpty(status)) q = q.Where(o => o.Status == status);

        return await q.OrderByDescending(o => o.OrderedAtUtc).Select(o => ToResponse(o)).ToListAsync();
    }

    public async Task<LabOrderResponse?> GetOrderByIdAsync(Guid id)
    {
        var o = await _db.LabOrders
            .Include(o => o.Doctor).ThenInclude(d => d.User)
            .Include(o => o.Patient).ThenInclude(p => p.User)
            .Include(o => o.Tests)
            .Include(o => o.Results).ThenInclude(r => r.LabOrderTest)
            .FirstOrDefaultAsync(o => o.Id == id);
        return o is null ? null : ToResponse(o);
    }

    public async Task<LabOrderResponse> CreateOrderAsync(CreateLabOrderRequest request)
    {
        var order = new LabOrder
        {
            Id = Guid.NewGuid(),
            AppointmentId = request.AppointmentId,
            DoctorId = request.DoctorId,
            PatientId = request.PatientId,
            Priority = request.Priority,
            Notes = request.Notes,
            Status = "Ordered",
            OrderedAtUtc = DateTime.UtcNow,
            Tests = request.Tests?.Select(t => new LabOrderTest
            {
                Id = Guid.NewGuid(),
                TestName = t.TestName,
                TestCode = t.TestCode,
                SpecimenType = t.SpecimenType,
                Status = "Pending"
            }).ToList() ?? new List<LabOrderTest>()
        };

        _db.LabOrders.Add(order);
        await _db.SaveChangesAsync();
        return (await GetOrderByIdAsync(order.Id))!;
    }

    public async Task<LabOrderResponse?> UpdateOrderStatusAsync(Guid id, string status)
    {
        var order = await _db.LabOrders.FindAsync(id);
        if (order is null) return null;
        order.Status = status;
        if (status == "Completed") order.CompletedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return await GetOrderByIdAsync(id);
    }

    public async Task<LabResultResponse> AddResultAsync(Guid labOrderId, CreateLabResultRequest request)
    {
        var result = new LabResult
        {
            Id = Guid.NewGuid(),
            LabOrderId = labOrderId,
            LabOrderTestId = request.LabOrderTestId,
            Value = request.Value,
            Unit = request.Unit,
            ReferenceRange = request.ReferenceRange,
            Flag = request.Flag,
            IsAbnormal = request.IsAbnormal,
            Notes = request.Notes,
            ResultAtUtc = DateTime.UtcNow,
            RecordedByUserId = request.RecordedByUserId
        };

        // Update test status
        var test = await _db.LabOrderTests.FindAsync(request.LabOrderTestId);
        if (test is not null) test.Status = "Resulted";

        _db.LabResults.Add(result);
        await _db.SaveChangesAsync();

        return new LabResultResponse(result.Id, result.LabOrderTestId,
            test?.TestName ?? "", result.Value, result.Unit,
            result.ReferenceRange, result.Flag, result.IsAbnormal,
            result.Notes, result.ResultAtUtc);
    }

    private static LabOrderResponse ToResponse(LabOrder o) =>
        new(o.Id, o.AppointmentId,
            o.DoctorId, o.Doctor?.User?.FullName ?? "",
            o.PatientId, o.Patient?.User?.FullName ?? "", o.Patient?.MRN,
            o.Status, o.Priority, o.Notes, o.OrderedAtUtc, o.CompletedAtUtc,
            o.Tests.Select(t => new LabOrderTestResponse(t.Id, t.TestName, t.TestCode, t.SpecimenType, t.Status)).ToList(),
            o.Results.Select(r => new LabResultResponse(r.Id, r.LabOrderTestId, r.LabOrderTest?.TestName ?? "", r.Value, r.Unit, r.ReferenceRange, r.Flag, r.IsAbnormal, r.Notes, r.ResultAtUtc)).ToList());
}
