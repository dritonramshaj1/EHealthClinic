using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoices;
    private readonly IAuditService _audit;

    public InvoicesController(IInvoiceService invoices, IAuditService audit)
    {
        _invoices = invoices;
        _audit = audit;
    }

    [HttpGet]
    [Authorize(Policy = "billing.read")]
    public async Task<IActionResult> GetAll([FromQuery] Guid? patientId, [FromQuery] string? status)
    {
        var result = await _invoices.GetAllAsync(patientId, status);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "billing.read")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _invoices.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "billing.write")]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest request)
    {
        var result = await _invoices.CreateAsync(request);
        await _audit.LogAsync(GetUserId(), "Create", "Invoice", result.Id.ToString(), $"Invoice {result.InvoiceNumber} created");
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = "billing.write")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateInvoiceStatusRequest request)
    {
        var result = await _invoices.UpdateStatusAsync(id, request.Status);
        if (result is null) return NotFound();
        await _audit.LogAsync(GetUserId(), "Update", "Invoice", id.ToString(), $"Invoice status → {request.Status}");
        return Ok(result);
    }

    [HttpPost("{id:guid}/pay")]
    [Authorize(Policy = "billing.write")]
    public async Task<IActionResult> MarkAsPaid(Guid id)
    {
        var result = await _invoices.UpdateStatusAsync(id, "Paid");
        if (result is null) return NotFound();
        await _audit.LogAsync(GetUserId(), "Pay", "Invoice", id.ToString(), "Invoice marked as paid");
        return Ok(result);
    }

    [HttpPost("{id:guid}/items")]
    [Authorize(Policy = "billing.write")]
    public async Task<IActionResult> AddItem(Guid id, [FromBody] CreateInvoiceItemRequest request)
    {
        var result = await _invoices.AddItemAsync(id, request);
        if (result is null) return NotFound();
        return Ok(result);
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }
}
