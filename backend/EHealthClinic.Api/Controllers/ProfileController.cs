using EHealthClinic.Api.Data;
using EHealthClinic.Api.Entities;
using EHealthClinic.Api.Helpers;
using EHealthClinic.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public sealed class ProfileController : ControllerBase
{
    private readonly UserManager<AppUser> _users;
    private readonly ApplicationDbContext _db;

    public ProfileController(UserManager<AppUser> users, ApplicationDbContext db)
    {
        _users = users;
        _db = db;
    }

    /// <summary>
    /// Get current user's profile, including role-specific fields.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> Get()
    {
        var userId = User.GetUserId();
        var appUser = await _users.FindByIdAsync(userId.ToString());
        if (appUser is null) return NotFound();

        var roles = await _users.GetRolesAsync(appUser);

        object? roleProfile = null;

        if (roles.Contains(Roles.Doctor))
        {
            var doc = await _db.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
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
            var pat = await _db.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
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
            appUser.Id,
            appUser.FullName,
            appUser.Email,
            Roles = roles,
            appUser.CreatedAtUtc,
            RoleProfile = roleProfile
        });
    }

    /// <summary>
    /// Update current user's profile.
    /// </summary>
    [HttpPut]
    public async Task<ActionResult> Update([FromBody] UpdateProfileRequest req)
    {
        var userId = User.GetUserId();
        var appUser = await _users.FindByIdAsync(userId.ToString());
        if (appUser is null) return NotFound();

        // Update base fields
        if (!string.IsNullOrWhiteSpace(req.FullName))
            appUser.FullName = req.FullName.Trim();

        if (!string.IsNullOrWhiteSpace(req.Email) && req.Email != appUser.Email)
        {
            var existing = await _users.FindByEmailAsync(req.Email);
            if (existing is not null && existing.Id != userId)
                return BadRequest(new { error = "Email is already in use." });

            appUser.Email = req.Email.Trim();
            appUser.NormalizedEmail = req.Email.Trim().ToUpperInvariant();
            appUser.UserName = req.Email.Trim();
            appUser.NormalizedUserName = req.Email.Trim().ToUpperInvariant();
        }

        await _users.UpdateAsync(appUser);

        // Update role-specific fields
        var roles = await _users.GetRolesAsync(appUser);

        if (roles.Contains(Roles.Doctor) && req.DoctorProfile is not null)
        {
            var doc = await _db.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
            if (doc is not null)
            {
                if (req.DoctorProfile.Specialty is not null)
                    doc.Specialty = req.DoctorProfile.Specialty;
                if (req.DoctorProfile.LicenseNumber is not null)
                    doc.LicenseNumber = req.DoctorProfile.LicenseNumber;
                if (req.DoctorProfile.Bio is not null)
                    doc.Bio = req.DoctorProfile.Bio;
                if (req.DoctorProfile.YearsOfExperience.HasValue)
                    doc.YearsOfExperience = req.DoctorProfile.YearsOfExperience.Value;
                if (req.DoctorProfile.Education is not null)
                    doc.Education = req.DoctorProfile.Education;
                if (req.DoctorProfile.Certifications is not null)
                    doc.Certifications = req.DoctorProfile.Certifications;
                if (req.DoctorProfile.Languages is not null)
                    doc.Languages = req.DoctorProfile.Languages;
                if (req.DoctorProfile.ConsultationFee.HasValue)
                    doc.ConsultationFee = req.DoctorProfile.ConsultationFee;
                await _db.SaveChangesAsync();
            }
        }

        if (roles.Contains(Roles.Patient) && req.PatientProfile is not null)
        {
            var pat = await _db.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
            if (pat is not null)
            {
                if (req.PatientProfile.BloodType is not null)
                    pat.BloodType = req.PatientProfile.BloodType;
                if (req.PatientProfile.Allergies is not null)
                    pat.Allergies = req.PatientProfile.Allergies;
                if (req.PatientProfile.DateOfBirth is not null)
                    pat.DateOfBirth = DateOnly.Parse(req.PatientProfile.DateOfBirth);
                await _db.SaveChangesAsync();
            }
        }

        return Ok(new { message = "Profile updated successfully." });
    }

    /// <summary>
    /// Get list of predefined specialties.
    /// </summary>
    [HttpGet("/api/specialties")]
    [AllowAnonymous]
    public ActionResult GetSpecialties() => Ok(Specialties.All);

    /// <summary>
    /// Change password.
    /// </summary>
    [HttpPost("change-password")]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var userId = User.GetUserId();
        var appUser = await _users.FindByIdAsync(userId.ToString());
        if (appUser is null) return NotFound();

        var result = await _users.ChangePasswordAsync(appUser, req.CurrentPassword, req.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { error = string.Join("; ", result.Errors.Select(e => e.Description)) });

        return Ok(new { message = "Password changed successfully." });
    }
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

public sealed record UpdateProfileRequest(
    string? FullName,
    string? Email,
    DoctorProfileUpdate? DoctorProfile,
    PatientProfileUpdate? PatientProfile
);

public sealed record DoctorProfileUpdate(
    string? Specialty, string? LicenseNumber, string? Bio,
    int? YearsOfExperience, string? Education, string? Certifications,
    string? Languages, decimal? ConsultationFee
);
public sealed record PatientProfileUpdate(string? BloodType, string? Allergies, string? DateOfBirth);
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
