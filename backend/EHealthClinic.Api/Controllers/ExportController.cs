using System.Text;
using EHealthClinic.Api.Data;
using EHealthClinic.Api.Helpers;
using EHealthClinic.Api.Models;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/export")]
[Authorize]
public sealed class ExportController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IMedicalRecordService _records;

    public ExportController(ApplicationDbContext db, IMedicalRecordService records)
    {
        _db = db;
        _records = records;
    }

    /// <summary>
    /// Export appointments to CSV or JSON.
    /// format: csv | json (default: csv)
    /// </summary>
    [HttpGet("appointments")]
    public async Task<ActionResult> ExportAppointments(
        [FromQuery] string format = "csv",
        [FromQuery] DateTime? fromUtc = null,
        [FromQuery] DateTime? toUtc = null,
        [FromQuery] string? status = null)
    {
        var userId = User.GetUserId();
        var roles = User.Claims
            .Where(c => c.Type.Contains("role", StringComparison.OrdinalIgnoreCase))
            .Select(c => c.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var q = _db.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .AsQueryable();

        if (fromUtc is not null) q = q.Where(a => a.StartsAtUtc >= fromUtc);
        if (toUtc is not null) q = q.Where(a => a.StartsAtUtc <= toUtc);
        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(a => a.Status.ToLower() == status.Trim().ToLower());

        if (!roles.Contains(Roles.Admin))
        {
            if (roles.Contains(Roles.Doctor))
            {
                var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
                if (doctor is null) return Forbid();
                q = q.Where(a => a.DoctorId == doctor.Id);
            }
            else
            {
                var patient = await _db.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient is null) return Forbid();
                q = q.Where(a => a.PatientId == patient.Id);
            }
        }

        var list = await q
            .OrderByDescending(a => a.StartsAtUtc)
            .Select(a => new
            {
                a.Id,
                StartsAt = a.StartsAtUtc.ToString("yyyy-MM-dd HH:mm"),
                EndsAt = a.EndsAtUtc.ToString("yyyy-MM-dd HH:mm"),
                a.Status,
                Doctor = a.Doctor.User.FullName,
                Specialty = a.Doctor.Specialty,
                Patient = a.Patient.User.FullName,
                Reason = a.Reason ?? ""
            })
            .ToListAsync();

        if (format.ToLower() == "json")
        {
            return Ok(list);
        }

        // CSV
        var csv = new StringBuilder();
        csv.AppendLine("Id,StartsAt,EndsAt,Status,Doctor,Specialty,Patient,Reason");
        foreach (var a in list)
            csv.AppendLine($"{a.Id},{a.StartsAt},{a.EndsAt},{a.Status},{Escape(a.Doctor)},{Escape(a.Specialty)},{Escape(a.Patient)},{Escape(a.Reason)}");

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", $"appointments_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    /// <summary>
    /// Export medical records to CSV or JSON.
    /// Admin/Doctor only.
    /// </summary>
    [HttpGet("medical-records/{patientId:guid}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Doctor}")]
    public async Task<ActionResult> ExportMedicalRecord(Guid patientId, [FromQuery] string format = "csv")
    {
        var doc = await _records.GetByPatientAsync(patientId);
        if (doc is null) return NotFound(new { error = "Medical record not found." });

        var entries = doc.Entries ?? new();

        if (format.ToLower() == "json")
            return Ok(new { patientId, entries });

        var csv = new StringBuilder();
        csv.AppendLine("Date,Title,Diagnosis,Description,Tags");
        foreach (var e in entries)
            csv.AppendLine($"{e.DateUtc:yyyy-MM-dd},{Escape(e.Title)},{Escape(e.Diagnosis ?? "")},{Escape(e.Description ?? "")},{Escape(string.Join(";", e.Tags ?? []))}");

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", $"medical_record_{patientId}_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    /// <summary>
    /// Export patients list (Admin only).
    /// </summary>
    [HttpGet("patients")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult> ExportPatients([FromQuery] string format = "csv")
    {
        var list = await _db.Patients
            .Include(p => p.User)
            .OrderBy(p => p.User.FullName)
            .Select(p => new
            {
                p.Id,
                Name = p.User.FullName,
                Email = p.User.Email ?? "",
                p.BloodType,
                DateOfBirth = p.DateOfBirth.HasValue ? p.DateOfBirth.Value.ToString("yyyy-MM-dd") : "",
                p.Allergies
            })
            .ToListAsync();

        if (format.ToLower() == "json")
            return Ok(list);

        var csv = new StringBuilder();
        csv.AppendLine("Id,Name,Email,BloodType,DateOfBirth,Allergies");
        foreach (var p in list)
            csv.AppendLine($"{p.Id},{Escape(p.Name)},{Escape(p.Email)},{Escape(p.BloodType)},{p.DateOfBirth},{Escape(p.Allergies ?? "")}");

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", $"patients_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    private static string Escape(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }
}
