using EHealthClinic.Api.Data;
using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class PrescriptionsController : ControllerBase
{
    private readonly IPrescriptionService _prescriptions;
    private readonly IAuditService _audit;
    private readonly INotificationService _notifications;
    private readonly ApplicationDbContext _db;

    public PrescriptionsController(IPrescriptionService prescriptions, IAuditService audit, INotificationService notifications, ApplicationDbContext db)
    {
        _prescriptions = prescriptions;
        _audit = audit;
        _notifications = notifications;
        _db = db;
    }

    [HttpGet]
    [Authorize(Policy = "prescriptions.read")]
    public async Task<IActionResult> GetAll([FromQuery] Guid? patientId, [FromQuery] Guid? doctorId, [FromQuery] string? status)
    {
        var result = await _prescriptions.GetAllAsync(patientId, doctorId);
        if (!string.IsNullOrEmpty(status))
            result = result.Where(p => p.Status == status).ToList();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "prescriptions.read")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _prescriptions.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "prescriptions.write")]
    public async Task<IActionResult> Create([FromBody] CreatePrescriptionRequest request)
    {
        var result = await _prescriptions.CreateAsync(request);
        await _audit.LogAsync(GetUserId(), "Create", "Prescription", result.Id.ToString(), $"Prescription issued for patient {result.PatientId}");
        var patient = await _db.Patients.FindAsync(result.PatientId);
        if (patient != null)
            await _notifications.CreateAsync(patient.UserId, "Prescription", "Ju është lëshuar një recetë e re. Kontrolloni te Recetat.");
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = "prescriptions.write")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdatePrescriptionStatusRequest request)
    {
        var result = await _prescriptions.UpdateStatusAsync(id, request.Status);
        if (result is null) return NotFound();
        await _audit.LogAsync(GetUserId(), "Update", "Prescription", id.ToString(), $"Status → {request.Status}");
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "prescriptions.write")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var result = await _prescriptions.UpdateStatusAsync(id, "Cancelled");
        if (result is null) return NotFound();
        await _audit.LogAsync(GetUserId(), "Cancel", "Prescription", id.ToString(), "Prescription cancelled");
        return Ok(result);
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }
}
