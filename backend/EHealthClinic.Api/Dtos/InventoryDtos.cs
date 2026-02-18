namespace EHealthClinic.Api.Dtos;

public record CreateInventoryItemRequest(string Name, string? Description, string Category, string? SKU, int ReorderLevel, decimal? UnitCost, string Unit, Guid? BranchId, DateTime? ExpiresAtUtc);
public record UpdateInventoryItemRequest(string Name, string? Description, string Category, string? SKU, int ReorderLevel, decimal? UnitCost, string Unit, bool IsActive);
public record CreateInventoryMovementRequest(string MovementType, int Quantity, string? Reason, string? ReferenceId, Guid RecordedByUserId);
public record InventoryMovementResponse(Guid Id, string MovementType, int Quantity, int QuantityAfter, string? Reason, DateTime CreatedAtUtc);
public record InventoryItemResponse(
    Guid Id, string Name, string? Description, string Category, string? SKU,
    int QuantityOnHand, int ReorderLevel, decimal? UnitCost, string Unit,
    Guid? BranchId, string? BranchName, DateTime? ExpiresAtUtc, bool IsActive,
    bool IsLowStock, DateTime CreatedAtUtc);
