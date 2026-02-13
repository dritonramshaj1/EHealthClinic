namespace EHealthClinic.Api.Models;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "EHealthClinic";
    public string Audience { get; set; } = "EHealthClinic";
    public string Key { get; set; } = "";
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
}
