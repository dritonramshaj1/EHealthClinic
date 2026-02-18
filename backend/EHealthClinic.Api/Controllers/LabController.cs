using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class LabController : ControllerBase
{
    private readonly ILabService _lab;
    private readonly IAuditService _audit;

    public LabController(ILabService lab, IAuditService audit)
    {
        _lab = lab;
        _audit = audit;
    }

    [HttpGet("orders")]
    [Authorize(Policy = "lab.read")]
    public async Task<IActionResult> GetOrders([FromQuery] Guid? patientId, [FromQuery] Guid? doctorId, [FromQuery] string? status)
    {
        var result = await _lab.GetOrdersAsync(patientId, doctorId, status);
        return Ok(result);
    }

    [HttpGet("orders/{id:guid}")]
    [Authorize(Policy = "lab.read")]
    public async Task<IActionResult> GetOrderById(Guid id)
    {
        var result = await _lab.GetOrderByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("orders")]
    [Authorize(Policy = "lab.write")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateLabOrderRequest request)
    {
        var result = await _lab.CreateOrderAsync(request);
        await _audit.LogAsync(GetUserId(), "Create", "LabOrder", result.Id.ToString(), $"Lab order for patient {result.PatientId}");
        return CreatedAtAction(nameof(GetOrderById), new { id = result.Id }, result);
    }

    [HttpPatch("orders/{id:guid}/status")]
    [Authorize(Policy = "lab.write")]
    public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateLabOrderStatusRequest request)
    {
        var result = await _lab.UpdateOrderStatusAsync(id, request.Status);
        if (result is null) return NotFound();
        await _audit.LogAsync(GetUserId(), "Update", "LabOrder", id.ToString(), $"Status → {request.Status}");
        return Ok(result);
    }

    [HttpGet("orders/{orderId:guid}/results")]
    [Authorize(Policy = "lab.read")]
    public async Task<IActionResult> GetResults(Guid orderId)
    {
        var order = await _lab.GetOrderByIdAsync(orderId);
        if (order is null) return NotFound();
        return Ok(order.Results);
    }

    [HttpPost("orders/{orderId:guid}/results")]
    [Authorize(Policy = "lab.write")]
    public async Task<IActionResult> AddResult(Guid orderId, [FromBody] CreateLabResultRequest request)
    {
        var result = await _lab.AddResultAsync(orderId, request);
        await _audit.LogAsync(GetUserId(), "Create", "LabResult", result.Id.ToString(), $"Result added for order {orderId}");
        return Ok(result);
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }
}
