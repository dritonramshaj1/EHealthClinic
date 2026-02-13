using EHealthClinic.Api.Entities;

namespace EHealthClinic.Api.Services;

public interface ITokenService
{
    Task<(string token, DateTime expiresAtUtc)> CreateAccessTokenAsync(AppUser user);
    (string token, DateTime expiresAtUtc) CreateRefreshToken();
}
