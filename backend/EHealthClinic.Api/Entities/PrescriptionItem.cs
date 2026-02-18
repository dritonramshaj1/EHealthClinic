namespace EHealthClinic.Api.Entities;

public sealed class PrescriptionItem
{
    public Guid Id { get; set; }

    public Guid PrescriptionId { get; set; }
    public Prescription Prescription { get; set; } = default!;

    public string MedicationName { get; set; } = "";
    public string Dosage { get; set; } = "";
    public string Frequency { get; set; } = "";
    public int DurationDays { get; set; }
    public string? Instructions { get; set; }
    public int? Quantity { get; set; }
}
