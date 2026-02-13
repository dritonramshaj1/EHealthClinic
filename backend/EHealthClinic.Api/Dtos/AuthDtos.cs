namespace EHealthClinic.Api.Dtos;

public sealed record RegisterRequest(
    string FullName,
    string Email,
    string Password,
    string Role // Admin | Doctor | Patient (normally you would restrict who can create admins)
);

public sealed record LoginRequest(string Email, string Password);

public sealed record AuthResponse(
    string AccessToken,
    DateTime AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTime RefreshTokenExpiresAtUtc,
    string UserId,
    string Email,
    string FullName,
    string[] Roles
);

public sealed record RefreshRequest(string RefreshToken);
