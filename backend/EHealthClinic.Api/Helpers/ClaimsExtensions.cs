using System.Security.Claims;

namespace EHealthClinic.Api.Helpers;

public static class ClaimsExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier) 
                  ?? user.FindFirstValue("sub")
                  ?? user.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");

        if (Guid.TryParse(sub, out var id)) return id;

        // JwtRegisteredClaimNames.Sub often mapped to NameIdentifier automatically by JwtBearer,
        // but keep fallback:
        var raw = user.Claims.FirstOrDefault(c => c.Type.EndsWith("/nameidentifier", StringComparison.OrdinalIgnoreCase))?.Value;
        if (Guid.TryParse(raw, out id)) return id;

        throw new UnauthorizedAccessException("User id claim missing.");
    }
}
