namespace EHealthClinic.Api.Entities;

public sealed class LabOrderTest
{
    public Guid Id { get; set; }

    public Guid LabOrderId { get; set; }
    public LabOrder LabOrder { get; set; } = default!;

    public string TestName { get; set; } = "";
    public string? TestCode { get; set; }
    public string? SpecimenType { get; set; }

    // Pending | InProgress | Resulted
    public string Status { get; set; } = "Pending";
}
