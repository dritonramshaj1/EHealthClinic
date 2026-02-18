namespace EHealthClinic.Api.Entities;

public sealed class ClinicService
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }

    // Consultation | Lab | Radiology | Procedure | Vaccination | Other
    public string Category { get; set; } = "Consultation";

    public decimal Price { get; set; }
    public string Currency { get; set; } = "EUR";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
