using EHealthClinic.Api.Data;
using EHealthClinic.Api.Helpers;
using EHealthClinic.Api.Models;
using EHealthClinic.Api.Mongo.Documents;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/medical-records")]
[Authorize]
public sealed class MedicalRecordsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IMedicalRecordService _records;
    private readonly IActivityLogService _logs;

    public MedicalRecordsController(ApplicationDbContext db, IMedicalRecordService records, IActivityLogService logs)
    {
        _db = db;
        _records = records;
        _logs = logs;
    }

    [HttpGet("me")]
    [Authorize(Roles = $"{Roles.Patient}")]
    public async Task<ActionResult> GetMine()
    {
        var userId = User.GetUserId();
        var patient = await _db.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
        if (patient is null) return Forbid();

        var doc = await _records.GetByPatientAsync(patient.Id);
        return Ok(doc ?? new MedicalRecordDoc { PatientId = patient.Id });
    }

    [HttpGet("{patientId:guid}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Doctor}")]
    public async Task<ActionResult> GetForPatient(Guid patientId)
    {
        var doc = await _records.GetByPatientAsync(patientId);
        return Ok(doc ?? new MedicalRecordDoc { PatientId = patientId });
    }

    [HttpPost("{patientId:guid}/entries")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Doctor}")]
    public async Task<ActionResult> AddEntry(Guid patientId, [FromBody] MedicalRecordEntry entry)
    {
        if (string.IsNullOrWhiteSpace(entry.Title))
            return BadRequest(new { error = "Title is required." });

        entry.DateUtc = entry.DateUtc == default ? DateTime.UtcNow : entry.DateUtc;

        await _records.UpsertEntryAsync(patientId, entry);
        await _logs.LogAsync(User.GetUserId(), "MedicalRecordEntryAdded", $"PatientId={patientId};Title={entry.Title}");

        return NoContent();
    }
}
