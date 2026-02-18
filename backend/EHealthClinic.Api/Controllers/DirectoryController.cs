using EHealthClinic.Api.Data;
using EHealthClinic.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/directory")]
[Authorize]
public sealed class DirectoryController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public DirectoryController(ApplicationDbContext db) => _db = db;

    [HttpGet("doctors")]
    public async Task<ActionResult> Doctors([FromQuery] string? q)
    {
        var query = _db.Doctors.Include(d => d.User).AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var s = q.Trim().ToLowerInvariant();
            query = query.Where(d => d.User.FullName.ToLower().Contains(s) || d.Specialty.ToLower().Contains(s));
        }

        var list = await query.OrderBy(d => d.User.FullName).Take(50).Select(d => new
        {
            d.Id,
            UserId = d.UserId,
            d.Specialty,
            Name = d.User.FullName
        }).ToListAsync();

        return Ok(list);
    }

    [HttpGet("patients")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Doctor}")]
    public async Task<ActionResult> Patients([FromQuery] string? q)
    {
        var query = _db.Patients.Include(p => p.User).AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var s = q.Trim().ToLowerInvariant();
            query = query.Where(p => p.User.FullName.ToLower().Contains(s) || p.User.Email!.ToLower().Contains(s));
        }

        var list = await query.OrderBy(p => p.User.FullName).Take(50).Select(p => new
        {
            p.Id,
            Name = p.User.FullName,
            Email = p.User.Email
        }).ToListAsync();

        return Ok(list);
    }
}
