using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class QueueController : ControllerBase
{
    private readonly IQueueService _queue;
    private readonly IAuditService _audit;

    public QueueController(IQueueService queue, IAuditService audit)
    {
        _queue = queue;
        _audit = audit;
    }

    [HttpGet]
    [Authorize(Policy = "queue.read")]
    public async Task<IActionResult> GetQueue([FromQuery] Guid branchId, [FromQuery] string? status = null)
    {
        var result = await _queue.GetTodayQueueAsync(branchId);
        if (!string.IsNullOrEmpty(status))
            result = result.Where(e => e.Status == status).ToList();
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "queue.write")]
    public async Task<IActionResult> AddToQueue([FromBody] CreateQueueEntryRequest request)
    {
        var result = await _queue.AddToQueueAsync(request);
        await _audit.LogAsync(GetUserId(), "Create", "Queue", "QueueEntry", result.Id.ToString(),
            $"Patient added to queue #{result.QueueNumber}");
        return Ok(result);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = "queue.write")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateQueueStatusRequest request)
    {
        var result = await _queue.UpdateStatusAsync(id, request.Status);
        if (result is null) return NotFound();
        await _audit.LogAsync(GetUserId(), "Update", "Queue", "QueueEntry", id.ToString(),
            $"Queue status → {request.Status}");
        return Ok(result);
    }

    [HttpPost("{id:guid}/call")]
    [Authorize(Policy = "queue.write")]
    public async Task<IActionResult> CallNext(Guid id)
    {
        var result = await _queue.UpdateStatusAsync(id, "Called");
        if (result is null) return NotFound();
        await _audit.LogAsync(GetUserId(), "Call", "Queue", "QueueEntry", id.ToString(), "Called patient");
        return Ok(result);
    }

    [HttpGet("stats")]
    [Authorize(Policy = "queue.read")]
    public async Task<IActionResult> GetStats([FromQuery] Guid branchId)
    {
        var entries = await _queue.GetTodayQueueAsync(branchId);
        var stats = new QueueStatsResponse(
            entries.Count(e => e.Status == "Waiting"),
            entries.Count(e => e.Status == "Called"),
            entries.Count(e => e.Status == "InProgress"),
            entries.Count(e => e.Status == "Done"),
            entries.Count(e => e.Status == "Skipped"),
            entries.Count);
        return Ok(stats);
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }
}
