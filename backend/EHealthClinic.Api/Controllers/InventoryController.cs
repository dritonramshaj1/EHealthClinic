using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventory;
    private readonly IAuditService _audit;

    public InventoryController(IInventoryService inventory, IAuditService audit)
    {
        _inventory = inventory;
        _audit = audit;
    }

    [HttpGet]
    [Authorize(Policy = "inventory.read")]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? branchId,
        [FromQuery] string? category,
        [FromQuery] bool lowStockOnly = false)
    {
        var result = await _inventory.GetAllAsync(branchId, category, lowStockOnly);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "inventory.read")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _inventory.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "inventory.write")]
    public async Task<IActionResult> Create([FromBody] CreateInventoryItemRequest request)
    {
        var result = await _inventory.CreateAsync(request);
        await _audit.LogAsync(GetUserId(), "Create", "InventoryItem", result.Id.ToString(), $"Added inventory item: {result.Name}");
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "inventory.write")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateInventoryItemRequest request)
    {
        var result = await _inventory.UpdateAsync(id, request);
        if (result is null) return NotFound();
        await _audit.LogAsync(GetUserId(), "Update", "InventoryItem", id.ToString(), $"Updated: {result.Name}");
        return Ok(result);
    }

    [HttpGet("{id:guid}/movements")]
    [Authorize(Policy = "inventory.read")]
    public async Task<IActionResult> GetMovements(Guid id)
    {
        var result = await _inventory.GetMovementsAsync(id);
        return Ok(result);
    }

    [HttpPost("{id:guid}/movements")]
    [Authorize(Policy = "inventory.write")]
    public async Task<IActionResult> AddMovement(Guid id, [FromBody] CreateInventoryMovementRequest request)
    {
        request = request with { RecordedByUserId = GetUserId() };
        var result = await _inventory.AddMovementAsync(id, request);
        await _audit.LogAsync(GetUserId(), "Movement", "InventoryItem", id.ToString(), $"{request.MovementType}: {request.Quantity} units");
        return Ok(result);
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }
}
