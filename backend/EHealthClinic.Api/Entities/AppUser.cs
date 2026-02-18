using Microsoft.AspNetCore.Identity;

namespace EHealthClinic.Api.Entities;

public sealed class AppUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsDisabled { get; set; } = false;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }
}
