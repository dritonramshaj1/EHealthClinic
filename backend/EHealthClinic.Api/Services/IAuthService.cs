using EHealthClinic.Api.Dtos;

namespace EHealthClinic.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest req);
    Task<AuthResponse> LoginAsync(LoginRequest req);
    Task<AuthResponse> RefreshAsync(string refreshToken);
    Task RevokeAsync(string refreshToken);
}
