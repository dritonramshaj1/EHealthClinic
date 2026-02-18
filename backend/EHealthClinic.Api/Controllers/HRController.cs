using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/hr")]
[Authorize]
public sealed class HRController : ControllerBase
{
    private readonly IHRService _hr;
    private readonly IAuditService _audit;

    public HRController(IHRService hr, IAuditService audit)
    {
        _hr = hr;
        _audit = audit;
    }

    // ── Shifts ──────────────────────────────────────────────

    [HttpGet("shifts")]
    [Authorize(Policy = "hr.read")]
    public async Task<IActionResult> GetShifts([FromQuery] Guid? userId, [FromQuery] Guid? branchId)
    {
        var result = await _hr.GetShiftsAsync(userId, branchId);
        return Ok(result);
    }

    [HttpPost("shifts")]
    [Authorize(Policy = "hr.write")]
    public async Task<IActionResult> CreateShift([FromBody] CreateStaffShiftRequest request)
    {
        var result = await _hr.CreateShiftAsync(request);
        await _audit.LogAsync(GetUserId(), "Create", "StaffShift", result.Id.ToString(), $"Shift created for user {result.UserId}");
        return Ok(result);
    }

    [HttpPatch("shifts/{id:guid}/status")]
    [Authorize(Policy = "hr.write")]
    public async Task<IActionResult> UpdateShiftStatus(Guid id, [FromBody] UpdateShiftStatusRequest request)
    {
        var result = await _hr.UpdateShiftStatusAsync(id, request.Status);
        if (result is null) return NotFound();
        await _audit.LogAsync(GetUserId(), "Update", "StaffShift", id.ToString(), $"Shift status → {request.Status}");
        return Ok(result);
    }

    // ── Leave Requests ────────────────────────────────────────

    [HttpGet("leave")]
    [Authorize(Policy = "hr.read")]
    public async Task<IActionResult> GetLeaveRequests([FromQuery] Guid? userId, [FromQuery] string? status)
    {
        var result = await _hr.GetLeaveRequestsAsync(userId, status);
        return Ok(result);
    }

    [HttpPost("leave")]
    [Authorize(Policy = "hr.read")]
    public async Task<IActionResult> CreateLeaveRequest([FromBody] CreateLeaveRequestRequest request)
    {
        var result = await _hr.CreateLeaveRequestAsync(request);
        await _audit.LogAsync(GetUserId(), "Create", "LeaveRequest", result.Id.ToString(), $"Leave request by user {result.UserId}");
        return Ok(result);
    }

    [HttpPatch("leave/{id:guid}/review")]
    [Authorize(Policy = "hr.write")]
    public async Task<IActionResult> ReviewLeaveRequest(Guid id, [FromBody] ReviewLeaveRequest request)
    {
        request = request with { ReviewedByUserId = GetUserId() };
        var result = await _hr.ReviewLeaveRequestAsync(id, request);
        if (result is null) return NotFound();
        await _audit.LogAsync(GetUserId(), "Review", "LeaveRequest", id.ToString(), $"Leave request {request.Status}");
        return Ok(result);
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }
}
