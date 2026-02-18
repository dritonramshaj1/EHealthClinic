using EHealthClinic.Api.Dtos;

namespace EHealthClinic.Api.Services;

public interface IInventoryService
{
    Task<List<InventoryItemResponse>> GetAllAsync(Guid? branchId = null, string? category = null, bool lowStockOnly = false);
    Task<InventoryItemResponse?> GetByIdAsync(Guid id);
    Task<InventoryItemResponse> CreateAsync(CreateInventoryItemRequest request);
    Task<InventoryItemResponse?> UpdateAsync(Guid id, UpdateInventoryItemRequest request);
    Task<InventoryMovementResponse> AddMovementAsync(Guid itemId, CreateInventoryMovementRequest request);
    Task<List<InventoryMovementResponse>> GetMovementsAsync(Guid itemId);
}
