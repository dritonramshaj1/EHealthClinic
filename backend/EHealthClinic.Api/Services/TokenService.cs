using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using EHealthClinic.Api.Entities;
using EHealthClinic.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace EHealthClinic.Api.Services;

public sealed class TokenService : ITokenService
{
    private readonly JwtOptions _jwt;
    private readonly UserManager<AppUser> _userManager;

    public TokenService(IOptions<JwtOptions> jwt, UserManager<AppUser> userManager)
    {
        _jwt = jwt.Value;
        _userManager = userManager;
    }

    public async Task<(string token, DateTime expiresAtUtc)> CreateAccessTokenAsync(AppUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new("name", user.FullName ?? ""),
        };

        foreach (var r in roles)
            claims.Add(new Claim(ClaimTypes.Role, r));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expires = DateTime.UtcNow.AddMinutes(_jwt.AccessTokenMinutes);

        var jwt = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(jwt), expires);
    }

    public (string token, DateTime expiresAtUtc) CreateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        var token = Convert.ToBase64String(bytes);

        var expires = DateTime.UtcNow.AddDays(_jwt.RefreshTokenDays);
        return (token, expires);
    }
}
