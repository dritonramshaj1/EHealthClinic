using EHealthClinic.Api.Data;
using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Entities;
using EHealthClinic.Api.Helpers;
using EHealthClinic.Api.Models;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = Roles.Admin)]
public sealed class UsersController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly ApplicationDbContext _db;
    private readonly IActivityLogService _logs;

    public UsersController(UserManager<AppUser> userManager, ApplicationDbContext db, IActivityLogService logs)
    {
        _userManager = userManager;
        _db = db;
        _logs = logs;
    }

    /// <summary>List all role names (Admin only).</summary>
    [HttpGet("roles")]
    public ActionResult GetRoles()
    {
        return Ok(Roles.All);
    }

    [HttpGet]
    public async Task<ActionResult> List([FromQuery] string? role = null)
    {
        var allUsers = await _userManager.Users
            .OrderByDescending(u => u.CreatedAtUtc)
            .ToListAsync();

        var result = new List<object>();
        foreach (var u in allUsers)
        {
            var roles = (await _userManager.GetRolesAsync(u)).ToArray();
            if (!string.IsNullOrWhiteSpace(role) &&
                !roles.Contains(role, StringComparer.OrdinalIgnoreCase))
                continue;

            result.Add(new
            {
                u.Id,
                u.FullName,
                u.Email,
                Roles = roles,
                u.CreatedAtUtc,
                u.IsDisabled
            });
        }

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> GetById(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        var roles = (await _userManager.GetRolesAsync(user)).ToArray();
        object? roleProfile = null;

        if (roles.Contains(Roles.Doctor))
        {
            var doc = await _db.Doctors.FirstOrDefaultAsync(d => d.UserId == id);
            if (doc is not null)
                roleProfile = new
                {
                    doc.Specialty, doc.LicenseNumber, doc.Bio,
                    doc.YearsOfExperience, doc.Education,
                    doc.Certifications, doc.Languages, doc.ConsultationFee
                };
        }
        else if (roles.Contains(Roles.Patient))
        {
            var pat = await _db.Patients.FirstOrDefaultAsync(p => p.UserId == id);
            if (pat is not null)
                roleProfile = new
                {
                    pat.BloodType,
                    DateOfBirth = pat.DateOfBirth?.ToString("yyyy-MM-dd"),
                    pat.Allergies
                };
        }

        return Ok(new
        {
            user.Id,
            user.FullName,
            user.Email,
            Roles = roles,
            user.CreatedAtUtc,
            user.IsDisabled,
            RoleProfile = roleProfile
        });
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateUserRequest req)
    {
        var role = req.Role?.Trim() ?? "";
        if (!Roles.All.Contains(role, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { error = $"Role must be one of: {string.Join(", ", Roles.All)}." });

        role = Roles.All.First(r => r.Equals(role, StringComparison.OrdinalIgnoreCase));

        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = req.Email.Trim().ToLowerInvariant(),
            UserName = req.Email.Trim().ToLowerInvariant(),
            FullName = req.FullName.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        var res = await _userManager.CreateAsync(user, req.Password);
        if (!res.Succeeded)
            return BadRequest(new { error = string.Join("; ", res.Errors.Select(e => e.Description)) });

        await _userManager.AddToRoleAsync(user, role);

        if (role == Roles.Doctor)
        {
            _db.Doctors.Add(new DoctorProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Specialty = req.Specialty ?? "General",
                LicenseNumber = req.LicenseNumber ?? "",
                Bio = req.Bio,
                YearsOfExperience = req.YearsOfExperience ?? 0,
                Education = req.Education,
                Certifications = req.Certifications,
                Languages = req.Languages,
                ConsultationFee = req.ConsultationFee
            });
        }
        else if (role == Roles.Patient)
        {
            _db.Patients.Add(new PatientProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                BloodType = req.BloodType ?? "",
                Allergies = req.Allergies,
                DateOfBirth = req.DateOfBirth is not null ? DateOnly.Parse(req.DateOfBirth) : null
            });
        }
        await _db.SaveChangesAsync();

        await _logs.LogAsync(User.GetUserId(), "AdminCreatedUser",
            $"UserId={user.Id};Email={user.Email};Role={role}");

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, new { user.Id });
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UpdateUserRequest req)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.FullName))
            user.FullName = req.FullName.Trim();

        if (!string.IsNullOrWhiteSpace(req.Email) && req.Email != user.Email)
        {
            var existing = await _userManager.FindByEmailAsync(req.Email);
            if (existing is not null && existing.Id != id)
                return BadRequest(new { error = "Email already in use." });
            user.Email = req.Email.Trim();
            user.NormalizedEmail = req.Email.Trim().ToUpperInvariant();
            user.UserName = req.Email.Trim();
            user.NormalizedUserName = req.Email.Trim().ToUpperInvariant();
        }

        await _userManager.UpdateAsync(user);

        var roles = (await _userManager.GetRolesAsync(user)).ToArray();

        if (roles.Contains(Roles.Doctor))
        {
            var doc = await _db.Doctors.FirstOrDefaultAsync(d => d.UserId == id);
            if (doc is not null)
            {
                if (req.Specialty is not null) doc.Specialty = req.Specialty;
                if (req.LicenseNumber is not null) doc.LicenseNumber = req.LicenseNumber;
                if (req.Bio is not null) doc.Bio = req.Bio;
                if (req.YearsOfExperience.HasValue) doc.YearsOfExperience = req.YearsOfExperience.Value;
                if (req.Education is not null) doc.Education = req.Education;
                if (req.Certifications is not null) doc.Certifications = req.Certifications;
                if (req.Languages is not null) doc.Languages = req.Languages;
                if (req.ConsultationFee.HasValue) doc.ConsultationFee = req.ConsultationFee;
                await _db.SaveChangesAsync();
            }
        }
        else if (roles.Contains(Roles.Patient))
        {
            var pat = await _db.Patients.FirstOrDefaultAsync(p => p.UserId == id);
            if (pat is not null)
            {
                if (req.BloodType is not null) pat.BloodType = req.BloodType;
                if (req.Allergies is not null) pat.Allergies = req.Allergies;
                if (req.DateOfBirth is not null) pat.DateOfBirth = DateOnly.Parse(req.DateOfBirth);
                await _db.SaveChangesAsync();
            }
        }

        await _logs.LogAsync(User.GetUserId(), "AdminUpdatedUser", $"UserId={id}");

        return Ok(new { message = "User updated." });
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Disable(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        user.IsDisabled = true;
        await _userManager.SetLockoutEnabledAsync(user, true);
        await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
        await _userManager.UpdateAsync(user);

        await _logs.LogAsync(User.GetUserId(), "AdminDisabledUser", $"UserId={id}");

        return Ok(new { message = "User disabled." });
    }

    [HttpPatch("{id:guid}/enable")]
    public async Task<ActionResult> Enable(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        user.IsDisabled = false;
        await _userManager.SetLockoutEndDateAsync(user, null);
        await _userManager.SetLockoutEnabledAsync(user, false);
        await _userManager.UpdateAsync(user);

        await _logs.LogAsync(User.GetUserId(), "AdminEnabledUser", $"UserId={id}");

        return Ok(new { message = "User enabled." });
    }

    [HttpDelete("{id:guid}/permanently")]
    public async Task<ActionResult> DeletePermanently(Guid id)
    {
        var callerId = User.GetUserId();
        if (callerId == id)
            return BadRequest(new { error = "You cannot delete your own account." });

        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        await _logs.LogAsync(callerId, "AdminDeletedUser", $"UserId={id};Email={user.Email}");

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { error = string.Join("; ", result.Errors.Select(e => e.Description)) });

        return Ok(new { message = "User permanently deleted." });
    }
}
