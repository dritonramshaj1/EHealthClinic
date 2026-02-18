namespace EHealthClinic.Api.Entities;

public sealed class InventoryMovement
{
    public Guid Id { get; set; }

    public Guid InventoryItemId { get; set; }
    public InventoryItem InventoryItem { get; set; } = default!;

    // In | Out | Adjustment | Return | Expired
    public string MovementType { get; set; } = "In";

    public int Quantity { get; set; }
    public int QuantityAfter { get; set; }

    public string? Reason { get; set; }
    public string? ReferenceId { get; set; }

    public Guid RecordedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
