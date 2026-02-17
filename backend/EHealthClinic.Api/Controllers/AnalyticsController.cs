using EHealthClinic.Api.Data;
using EHealthClinic.Api.Helpers;
using EHealthClinic.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
public sealed class AnalyticsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public AnalyticsController(ApplicationDbContext db) => _db = db;

    /// <summary>
    /// Admin: full system analytics.
    /// Doctor: personal analytics (own appointments only).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> Get()
    {
        var userId = User.GetUserId();
        var roles  = User.Claims
            .Where(c => c.Type.Contains("role", StringComparison.OrdinalIgnoreCase))
            .Select(c => c.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var isAdmin  = roles.Contains(Roles.Admin);
        var isDoctor = roles.Contains(Roles.Doctor);

        var q = _db.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .AsQueryable();

        Guid? doctorProfileId = null;
        if (!isAdmin && isDoctor)
        {
            var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
            if (doctor is null) return Forbid();
            doctorProfileId = doctor.Id;
            q = q.Where(a => a.DoctorId == doctor.Id);
        }

        var appointments = await q.ToListAsync();

        // ── Status distribution (pie chart) ──────────────────────────
        var statusDistribution = appointments
            .GroupBy(a => a.Status)
            .Select(g => new { name = g.Key, value = g.Count() })
            .OrderBy(x => x.name)
            .ToList();

        // ── Appointments by month (line chart) — last 12 months ──────
        var now = DateTime.UtcNow;
        var monthlyData = Enumerable.Range(0, 12)
            .Select(i => now.AddMonths(-11 + i))
            .Select(m => new
            {
                month = m.ToString("MMM yyyy"),
                count = appointments.Count(a =>
                    a.StartsAtUtc.Year == m.Year && a.StartsAtUtc.Month == m.Month)
            })
            .ToList();

        // ── Appointments per doctor (bar chart) — Admin only ─────────
        object? perDoctor = null;
        if (isAdmin)
        {
            perDoctor = appointments
                .GroupBy(a => a.Doctor.User.FullName)
                .Select(g => new { name = g.Key, count = g.Count() })
                .OrderByDescending(x => x.count)
                .Take(10)
                .ToList();
        }

        // ── Top specialties (bar chart) ──────────────────────────────
        var topSpecialties = appointments
            .GroupBy(a => a.Doctor.Specialty)
            .Select(g => new { name = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .Take(8)
            .ToList();

        // ── Summary counts ───────────────────────────────────────────
        var total     = appointments.Count;
        var scheduled = appointments.Count(a => a.Status == "Scheduled");
        var completed = appointments.Count(a => a.Status == "Completed");
        var cancelled = appointments.Count(a => a.Status == "Cancelled");

        return Ok(new
        {
            summary = new { total, scheduled, completed, cancelled },
            statusDistribution,
            monthlyData,
            perDoctor,
            topSpecialties
        });
    }
}
