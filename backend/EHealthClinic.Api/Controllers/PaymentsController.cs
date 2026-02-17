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
[Route("api/payments")]
[Authorize]
public sealed class PaymentsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly INotificationService _notifications;
    private readonly IActivityLogService _logs;

    public PaymentsController(ApplicationDbContext db, INotificationService notifications, IActivityLogService logs)
    {
        _db = db;
        _notifications = notifications;
        _logs = logs;
    }

    /// <summary>
    /// List payments visible to the current user.
    /// Admin sees all, Doctor sees own patients' payments, Patient sees own.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> List()
    {
        var userId = User.GetUserId();
        var roles  = User.Claims
            .Where(c => c.Type.Contains("role", StringComparison.OrdinalIgnoreCase))
            .Select(c => c.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var q = _db.Payments
            .Include(p => p.Appointment)
                .ThenInclude(a => a.Doctor).ThenInclude(d => d.User)
            .Include(p => p.Appointment)
                .ThenInclude(a => a.Patient).ThenInclude(p => p.User)
            .AsQueryable();

        if (roles.Contains(Roles.Admin))
        {
            // see all
        }
        else if (roles.Contains(Roles.Doctor))
        {
            var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
            if (doctor is null) return Forbid();
            q = q.Where(p => p.Appointment.DoctorId == doctor.Id);
        }
        else
        {
            var patient = await _db.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
            if (patient is null) return Forbid();
            q = q.Where(p => p.Appointment.PatientId == patient.Id);
        }

        var list = await q
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new
            {
                p.Id,
                p.AppointmentId,
                p.Amount,
                p.Currency,
                p.Status,
                p.PaymentMethod,
                p.PaidAtUtc,
                p.CreatedAtUtc,
                AppointmentDate = p.Appointment.StartsAtUtc,
                Doctor  = p.Appointment.Doctor.User.FullName,
                Patient = p.Appointment.Patient.User.FullName,
                Reason  = p.Appointment.Reason ?? ""
            })
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>
    /// Create a payment for an appointment. Admin/Doctor only.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Doctor}")]
    public async Task<ActionResult> Create([FromBody] CreatePaymentRequest req)
    {
        if (req.Amount <= 0)
            return BadRequest(new { error = "Amount must be greater than 0." });

        var appointment = await _db.Appointments
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .FirstOrDefaultAsync(a => a.Id == req.AppointmentId);

        if (appointment is null)
            return NotFound(new { error = "Appointment not found." });

        // Check if payment already exists for this appointment
        var exists = await _db.Payments.AnyAsync(p => p.AppointmentId == req.AppointmentId);
        if (exists)
            return Conflict(new { error = "A payment already exists for this appointment." });

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            AppointmentId = req.AppointmentId,
            Amount = req.Amount,
            Currency = req.Currency,
            Status = "Pending",
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();

        // Notify patient
        await _notifications.CreateAsync(
            appointment.Patient.UserId,
            "Payment",
            $"A payment of {req.Amount:F2} {req.Currency} has been created for your appointment with Dr. {appointment.Doctor.User.FullName}.");

        await _logs.LogAsync(User.GetUserId(), "PaymentCreated", $"PaymentId={payment.Id};Amount={req.Amount} {req.Currency}");

        return CreatedAtAction(nameof(GetById), new { id = payment.Id }, new { payment.Id });
    }

    /// <summary>
    /// Get a single payment by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult> GetById(Guid id)
    {
        var payment = await _db.Payments
            .Include(p => p.Appointment)
                .ThenInclude(a => a.Doctor).ThenInclude(d => d.User)
            .Include(p => p.Appointment)
                .ThenInclude(a => a.Patient).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment is null) return NotFound();

        return Ok(new
        {
            payment.Id,
            payment.AppointmentId,
            payment.Amount,
            payment.Currency,
            payment.Status,
            payment.CreatedAtUtc,
            AppointmentDate = payment.Appointment.StartsAtUtc,
            Doctor  = payment.Appointment.Doctor.User.FullName,
            Patient = payment.Appointment.Patient.User.FullName,
            Reason  = payment.Appointment.Reason ?? ""
        });
    }

    /// <summary>
    /// Update payment status (Pending → Paid / Failed). Admin/Doctor only.
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Doctor}")]
    public async Task<ActionResult> UpdateStatus(Guid id, [FromBody] UpdatePaymentStatusRequest req)
    {
        var allowed = new[] { "Pending", "Paid", "Failed" };
        if (!allowed.Contains(req.Status, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { error = "Status must be Pending, Paid, or Failed." });

        var payment = await _db.Payments
            .Include(p => p.Appointment)
                .ThenInclude(a => a.Patient).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment is null) return NotFound();

        payment.Status = req.Status;
        await _db.SaveChangesAsync();

        // Notify patient
        await _notifications.CreateAsync(
            payment.Appointment.Patient.UserId,
            "Payment",
            $"Your payment of {payment.Amount:F2} {payment.Currency} has been marked as {payment.Status}.");

        await _logs.LogAsync(User.GetUserId(), "PaymentStatusChanged", $"PaymentId={id};Status={req.Status}");

        return NoContent();
    }

    /// <summary>
    /// Simulate payment (patient pays). Accepts payment method selection.
    /// </summary>
    [HttpPost("{id:guid}/pay")]
    public async Task<ActionResult> Pay(Guid id, [FromBody] SimulatePayRequest req)
    {
        var userId = User.GetUserId();

        var payment = await _db.Payments
            .Include(p => p.Appointment)
                .ThenInclude(a => a.Patient).ThenInclude(p => p.User)
            .Include(p => p.Appointment)
                .ThenInclude(a => a.Doctor).ThenInclude(d => d.User)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment is null) return NotFound();

        // Only the patient of this appointment (or admin) can pay
        var roles = User.Claims
            .Where(c => c.Type.Contains("role", StringComparison.OrdinalIgnoreCase))
            .Select(c => c.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (!roles.Contains(Roles.Admin))
        {
            var patient = await _db.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
            if (patient is null || payment.Appointment.PatientId != patient.Id)
                return Forbid();
        }

        if (payment.Status == "Paid")
            return BadRequest(new { error = "Payment is already paid." });

        var allowedMethods = new[] { "CreditCard", "PayPal", "BankTransfer" };
        if (!allowedMethods.Contains(req.PaymentMethod, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { error = "Invalid payment method." });

        payment.Status = "Paid";
        payment.Provider = "Simulated";
        payment.PaymentMethod = req.PaymentMethod;
        payment.PaidAtUtc = DateTime.UtcNow;
        payment.ExternalReference = $"SIM-{Guid.NewGuid():N}"[..20];
        await _db.SaveChangesAsync();

        // Notify doctor
        await _notifications.CreateAsync(
            payment.Appointment.Doctor.UserId,
            "Payment",
            $"Payment of {payment.Amount:F2} {payment.Currency} received from {payment.Appointment.Patient.User.FullName} via {req.PaymentMethod}.");

        await _logs.LogAsync(userId, "PaymentCompleted", $"PaymentId={id};Method={req.PaymentMethod}");

        return Ok(new
        {
            success = true,
            message = "Payment completed successfully.",
            payment.Status,
            payment.ExternalReference,
            payment.PaymentMethod,
            payment.PaidAtUtc
        });
    }

    /// <summary>
    /// Get payment receipt (Paid payments only).
    /// </summary>
    [HttpGet("{id:guid}/receipt")]
    public async Task<ActionResult> Receipt(Guid id)
    {
        var payment = await _db.Payments
            .Include(p => p.Appointment)
                .ThenInclude(a => a.Doctor).ThenInclude(d => d.User)
            .Include(p => p.Appointment)
                .ThenInclude(a => a.Patient).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment is null) return NotFound();
        if (payment.Status != "Paid")
            return BadRequest(new { error = "Receipt only available for paid payments." });

        return Ok(new
        {
            ReceiptNumber = payment.ExternalReference,
            payment.Amount,
            payment.Currency,
            payment.PaymentMethod,
            payment.PaidAtUtc,
            payment.CreatedAtUtc,
            Doctor  = payment.Appointment.Doctor.User.FullName,
            Patient = payment.Appointment.Patient.User.FullName,
            AppointmentDate = payment.Appointment.StartsAtUtc,
            Reason  = payment.Appointment.Reason ?? ""
        });
    }
}
