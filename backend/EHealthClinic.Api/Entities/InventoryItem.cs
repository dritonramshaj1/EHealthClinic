namespace EHealthClinic.Api.Entities;

public sealed class InventoryItem
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }

    // Medication | Equipment | Supplies | Other
    public string Category { get; set; } = "Supplies";

    public string? SKU { get; set; }
    public int QuantityOnHand { get; set; } = 0;
    public int ReorderLevel { get; set; } = 0;
    public decimal? UnitCost { get; set; }
    public string Unit { get; set; } = "pcs";

    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }

    public DateTime? ExpiresAtUtc { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<InventoryMovement> Movements { get; set; } = new List<InventoryMovement>();
}
