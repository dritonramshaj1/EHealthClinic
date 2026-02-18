using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class BranchesController : ControllerBase
{
    private readonly IBranchService _branches;
    private readonly IAuditService _audit;

    public BranchesController(IBranchService branches, IAuditService audit)
    {
        _branches = branches;
        _audit = audit;
    }

    [HttpGet]
    [Authorize(Policy = "branches.read")]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = true)
    {
        var result = await _branches.GetAllAsync();
        if (activeOnly) result = result.Where(b => b.IsActive).ToList();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "branches.read")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _branches.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "branches.write")]
    public async Task<IActionResult> Create([FromBody] CreateBranchRequest request)
    {
        var result = await _branches.CreateAsync(request);
        await _audit.LogAsync(GetUserId(), "Create", "Branch", result.Id.ToString(), $"Created branch: {result.Name}");
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "branches.write")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBranchRequest request)
    {
        var result = await _branches.UpdateAsync(id, request);
        if (result is null) return NotFound();
        await _audit.LogAsync(GetUserId(), "Update", "Branch", id.ToString(), $"Updated branch: {result.Name}");
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "branches.write")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var ok = await _branches.DeleteAsync(id);
        if (!ok) return NotFound();
        await _audit.LogAsync(GetUserId(), "Delete", "Branch", id.ToString(), "Deleted branch");
        return NoContent();
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }
}
