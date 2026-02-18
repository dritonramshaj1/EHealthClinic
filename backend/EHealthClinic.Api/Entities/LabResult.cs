namespace EHealthClinic.Api.Entities;

public sealed class LabResult
{
    public Guid Id { get; set; }

    public Guid LabOrderId { get; set; }
    public LabOrder LabOrder { get; set; } = default!;

    public Guid LabOrderTestId { get; set; }
    public LabOrderTest LabOrderTest { get; set; } = default!;

    public string Value { get; set; } = "";
    public string? Unit { get; set; }
    public string? ReferenceRange { get; set; }

    // Normal | High | Low | Critical
    public string? Flag { get; set; }
    public bool IsAbnormal { get; set; } = false;

    public string? Notes { get; set; }

    public DateTime ResultAtUtc { get; set; } = DateTime.UtcNow;
    public Guid RecordedByUserId { get; set; }
    public Guid? VerifiedByUserId { get; set; }
}
