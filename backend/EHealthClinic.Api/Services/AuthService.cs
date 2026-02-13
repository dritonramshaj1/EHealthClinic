using EHealthClinic.Api.Data;
using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Entities;
using EHealthClinic.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Services;

public sealed class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly ApplicationDbContext _db;
    private readonly ITokenService _tokenService;

    public AuthService(UserManager<AppUser> userManager, ApplicationDbContext db, ITokenService tokenService)
    {
        _userManager = userManager;
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest req)
    {
        var role = NormalizeRole(req.Role);

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
            throw new InvalidOperationException(string.Join("; ", res.Errors.Select(e => e.Description)));

        await _userManager.AddToRoleAsync(user, role);

        // Create profile row based on role
        if (role == Roles.Doctor)
        {
            _db.Doctors.Add(new DoctorProfile { Id = Guid.NewGuid(), UserId = user.Id, Specialty = "General", LicenseNumber = "" });
        }
        else if (role == Roles.Patient)
        {
            _db.Patients.Add(new PatientProfile { Id = Guid.NewGuid(), UserId = user.Id });
        }
        await _db.SaveChangesAsync();

        return await CreateAuthResponseAsync(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _userManager.Users.FirstOrDefaultAsync(x => x.Email == email);
        if (user is null) throw new UnauthorizedAccessException("Invalid credentials.");

        var ok = await _userManager.CheckPasswordAsync(user, req.Password);
        if (!ok) throw new UnauthorizedAccessException("Invalid credentials.");

        return await CreateAuthResponseAsync(user);
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken)
    {
        var rt = await _db.RefreshTokens
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Token == refreshToken);

        if (rt is null || !rt.IsActive)
            throw new UnauthorizedAccessException("Refresh token is invalid or expired.");

        // rotate refresh token
        rt.RevokedAtUtc = DateTime.UtcNow;
        var (newToken, newExp) = _tokenService.CreateRefreshToken();
        rt.ReplacedByToken = newToken;

        var newRt = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = rt.UserId,
            Token = newToken,
            ExpiresAtUtc = newExp,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.RefreshTokens.Add(newRt);
        await _db.SaveChangesAsync();

        return await CreateAuthResponseAsync(rt.User, newRt);
    }

    public async Task RevokeAsync(string refreshToken)
    {
        var rt = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == refreshToken);
        if (rt is null) return;

        rt.RevokedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private async Task<AuthResponse> CreateAuthResponseAsync(AppUser user, RefreshToken? existingRefreshToken = null)
    {
        var (access, accessExp) = await _tokenService.CreateAccessTokenAsync(user);
        var roles = (await _userManager.GetRolesAsync(user)).ToArray();

        RefreshToken rt;
        if (existingRefreshToken is not null)
        {
            rt = existingRefreshToken;
        }
        else
        {
            var (refresh, refreshExp) = _tokenService.CreateRefreshToken();
            rt = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = refresh,
                ExpiresAtUtc = refreshExp,
                CreatedAtUtc = DateTime.UtcNow
            };
            _db.RefreshTokens.Add(rt);
            await _db.SaveChangesAsync();
        }

        return new AuthResponse(
            AccessToken: access,
            AccessTokenExpiresAtUtc: accessExp,
            RefreshToken: rt.Token,
            RefreshTokenExpiresAtUtc: rt.ExpiresAtUtc,
            UserId: user.Id.ToString(),
            Email: user.Email ?? "",
            FullName: user.FullName ?? "",
            Roles: roles
        );
    }

    private static string NormalizeRole(string role)
    {
        var r = role?.Trim() ?? "";
        if (string.Equals(r, Roles.Admin, StringComparison.OrdinalIgnoreCase)) return Roles.Admin;
        if (string.Equals(r, Roles.Doctor, StringComparison.OrdinalIgnoreCase)) return Roles.Doctor;
        if (string.Equals(r, Roles.Patient, StringComparison.OrdinalIgnoreCase)) return Roles.Patient;
        throw new InvalidOperationException("Role must be Admin, Doctor, or Patient.");
    }
}
