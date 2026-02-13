using EHealthClinic.Api.Data;
using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Entities;
using EHealthClinic.Api.Helpers;
using EHealthClinic.Api.Models;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/appointments")]
[Authorize]
public sealed class AppointmentsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly INotificationService _notifications;
    private readonly IActivityLogService _logs;

    public AppointmentsController(ApplicationDbContext db, INotificationService notifications, IActivityLogService logs)
    {
        _db = db;
        _notifications = notifications;
        _logs = logs;
    }

    [HttpGet]
    public async Task<ActionResult> List([FromQuery] DateTime? fromUtc, [FromQuery] DateTime? toUtc)
    {
        var userId = User.GetUserId();
        var roles = User.Claims.Where(c => c.Type.EndsWith("/role") || c.Type.EndsWith("role") || c.Type.Contains("role", StringComparison.OrdinalIgnoreCase))
            .Select(c => c.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var q = _db.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .AsQueryable();

        if (fromUtc is not null) q = q.Where(a => a.StartsAtUtc >= fromUtc);
        if (toUtc is not null) q = q.Where(a => a.StartsAtUtc <= toUtc);

        if (roles.Contains(Roles.Admin))
        {
            // all
        }
        else if (roles.Contains(Roles.Doctor))
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

        var list = await q
            .OrderByDescending(a => a.StartsAtUtc)
            .Take(200)
            .Select(a => new
            {
                a.Id,
                a.StartsAtUtc,
                a.EndsAtUtc,
                a.Status,
                a.Reason,
                Doctor = new { a.DoctorId, Name = a.Doctor.User.FullName, a.Doctor.Specialty },
                Patient = new { a.PatientId, Name = a.Patient.User.FullName }
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Doctor}")]
    public async Task<ActionResult> Create([FromBody] CreateAppointmentRequest req)
    {
        if (req.EndsAtUtc <= req.StartsAtUtc)
            return BadRequest(new { error = "EndsAtUtc must be after StartsAtUtc." });

        var doctor = await _db.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == req.DoctorId);
        var patient = await _db.Patients.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == req.PatientId);
        if (doctor is null || patient is null) return BadRequest(new { error = "Doctor or patient not found." });

        // basic overlap check (same doctor)
        var overlap = await _db.Appointments.AnyAsync(a =>
            a.DoctorId == req.DoctorId &&
            a.Status != "Cancelled" &&
            req.StartsAtUtc < a.EndsAtUtc &&
            req.EndsAtUtc > a.StartsAtUtc);

        if (overlap) return Conflict(new { error = "Doctor already has an appointment in this time window." });

        var appt = new Appointment
        {
            Id = Guid.NewGuid(),
            DoctorId = req.DoctorId,
            PatientId = req.PatientId,
            StartsAtUtc = req.StartsAtUtc,
            EndsAtUtc = req.EndsAtUtc,
            Reason = req.Reason,
            Status = "Scheduled",
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Appointments.Add(appt);
        await _db.SaveChangesAsync();

        await _notifications.CreateAsync(doctor.UserId, "Appointment", $"New appointment scheduled with {patient.User.FullName} on {req.StartsAtUtc:u}");
        await _notifications.CreateAsync(patient.UserId, "Appointment", $"Your appointment with Dr. {doctor.User.FullName} is scheduled on {req.StartsAtUtc:u}");
        await _logs.LogAsync(User.GetUserId(), "AppointmentCreated", $"AppointmentId={appt.Id}");

        return CreatedAtAction(nameof(GetById), new { id = appt.Id }, new { appt.Id });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> GetById(Guid id)
    {
        var appt = await _db.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (appt is null) return NotFound();

        return Ok(new
        {
            appt.Id,
            appt.StartsAtUtc,
            appt.EndsAtUtc,
            appt.Status,
            appt.Reason,
            Doctor = new { appt.DoctorId, Name = appt.Doctor.User.FullName, appt.Doctor.Specialty },
            Patient = new { appt.PatientId, Name = appt.Patient.User.FullName }
        });
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Doctor}")]
    public async Task<ActionResult> UpdateStatus(Guid id, [FromBody] UpdateAppointmentStatusRequest req)
    {
        var appt = await _db.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (appt is null) return NotFound();

        var allowed = new[] { "Scheduled", "Completed", "Cancelled" };
        if (!allowed.Contains(req.Status, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { error = "Status must be Scheduled, Completed, or Cancelled." });

        appt.Status = req.Status;
        await _db.SaveChangesAsync();

        await _notifications.CreateAsync(appt.Patient.UserId, "Appointment", $"Appointment {appt.Id} status changed to {appt.Status}");
        await _logs.LogAsync(User.GetUserId(), "AppointmentStatusChanged", $"AppointmentId={appt.Id};Status={appt.Status}");

        return NoContent();
    }
}
