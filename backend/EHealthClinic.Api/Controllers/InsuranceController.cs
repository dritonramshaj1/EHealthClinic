using EHealthClinic.Api.Data;
using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Entities;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class InsuranceController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IAuditService _audit;

    public InsuranceController(ApplicationDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet]
    [Authorize(Policy = "insurance.read")]
    public async Task<IActionResult> GetAll([FromQuery] Guid? patientId, [FromQuery] string? status)
    {
        var q = _db.InsuranceClaims
            .Include(c => c.Patient).ThenInclude(p => p.User)
            .AsQueryable();

        if (patientId.HasValue) q = q.Where(c => c.PatientId == patientId.Value);
        if (!string.IsNullOrEmpty(status)) q = q.Where(c => c.Status == status);

        var result = await q.OrderByDescending(c => c.SubmittedAtUtc)
            .Select(c => new InsuranceClaimResponse(
                c.Id, c.InvoiceId, c.PatientId,
                c.Patient != null && c.Patient.User != null ? c.Patient.User.FullName : "",
                c.InsuranceCompany, c.PolicyNumber,
                c.ClaimAmount, c.ApprovedAmount, c.Status,
                c.ReferenceNumber, c.RejectionReason,
                c.SubmittedAtUtc, c.ResolvedAtUtc))
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "insurance.read")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var c = await _db.InsuranceClaims
            .Include(x => x.Patient).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (c is null) return NotFound();

        return Ok(new InsuranceClaimResponse(
            c.Id, c.InvoiceId, c.PatientId,
            c.Patient?.User?.FullName ?? "",
            c.InsuranceCompany, c.PolicyNumber,
            c.ClaimAmount, c.ApprovedAmount, c.Status,
            c.ReferenceNumber, c.RejectionReason,
            c.SubmittedAtUtc, c.ResolvedAtUtc));
    }

    [HttpPost]
    [Authorize(Policy = "insurance.write")]
    public async Task<IActionResult> Create([FromBody] CreateInsuranceClaimRequest request)
    {
        var claim = new InsuranceClaim
        {
            Id = Guid.NewGuid(),
            InvoiceId = request.InvoiceId,
            PatientId = request.PatientId,
            InsuranceCompany = request.InsuranceCompany,
            PolicyNumber = request.PolicyNumber,
            ClaimAmount = request.ClaimAmount,
            Status = "Submitted",
            SubmittedAtUtc = DateTime.UtcNow
        };

        _db.InsuranceClaims.Add(claim);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(GetUserId(), "Create", "Insurance", "InsuranceClaim", claim.Id.ToString(),
            $"Claim submitted for patient {request.PatientId}");
        return CreatedAtAction(nameof(GetById), new { id = claim.Id }, new { claim.Id });
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = "insurance.write")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateInsuranceClaimStatusRequest request)
    {
        var claim = await _db.InsuranceClaims.FindAsync(id);
        if (claim is null) return NotFound();

        claim.Status = request.Status;
        claim.ApprovedAmount = request.ApprovedAmount;
        claim.RejectionReason = request.RejectionReason;
        claim.ReferenceNumber = request.ReferenceNumber;

        if (request.Status is "Approved" or "Rejected" or "Paid")
            claim.ResolvedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _audit.LogAsync(GetUserId(), "Update", "Insurance", "InsuranceClaim", id.ToString(),
            $"Claim status -> {request.Status}");
        return Ok(new { claim.Id, claim.Status });
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }
}
