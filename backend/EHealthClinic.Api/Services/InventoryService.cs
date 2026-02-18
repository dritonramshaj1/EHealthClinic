using EHealthClinic.Api.Data;
using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Services;

public sealed class InventoryService : IInventoryService
{
    private readonly ApplicationDbContext _db;

    public InventoryService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<InventoryItemResponse>> GetAllAsync(Guid? branchId = null, string? category = null, bool lowStockOnly = false)
    {
        var q = _db.InventoryItems.Include(i => i.Branch).AsQueryable();
        if (branchId.HasValue) q = q.Where(i => i.BranchId == branchId.Value);
        if (!string.IsNullOrEmpty(category)) q = q.Where(i => i.Category == category);
        if (lowStockOnly) q = q.Where(i => i.QuantityOnHand <= i.ReorderLevel);

        return await q.OrderBy(i => i.Name).Select(i => ToResponse(i)).ToListAsync();
    }

    public async Task<InventoryItemResponse?> GetByIdAsync(Guid id)
    {
        var i = await _db.InventoryItems.Include(i => i.Branch).FirstOrDefaultAsync(i => i.Id == id);
        return i is null ? null : ToResponse(i);
    }

    public async Task<InventoryItemResponse> CreateAsync(CreateInventoryItemRequest request)
    {
        var item = new InventoryItem
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            Category = request.Category,
            SKU = request.SKU,
            QuantityOnHand = 0,
            ReorderLevel = request.ReorderLevel,
            UnitCost = request.UnitCost,
            Unit = request.Unit,
            BranchId = request.BranchId,
            ExpiresAtUtc = request.ExpiresAtUtc,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.InventoryItems.Add(item);
        await _db.SaveChangesAsync();
        return (await GetByIdAsync(item.Id))!;
    }

    public async Task<InventoryItemResponse?> UpdateAsync(Guid id, UpdateInventoryItemRequest request)
    {
        var item = await _db.InventoryItems.FindAsync(id);
        if (item is null) return null;

        item.Name = request.Name;
        item.Description = request.Description;
        item.Category = request.Category;
        item.SKU = request.SKU;
        item.ReorderLevel = request.ReorderLevel;
        item.UnitCost = request.UnitCost;
        item.Unit = request.Unit;
        item.IsActive = request.IsActive;

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<InventoryMovementResponse> AddMovementAsync(Guid itemId, CreateInventoryMovementRequest request)
    {
        var item = await _db.InventoryItems.FindAsync(itemId);
        if (item is null) throw new InvalidOperationException("Inventory item not found");

        var quantityAfter = request.MovementType == "In"
            ? item.QuantityOnHand + request.Quantity
            : item.QuantityOnHand - request.Quantity;

        var movement = new InventoryMovement
        {
            Id = Guid.NewGuid(),
            InventoryItemId = itemId,
            MovementType = request.MovementType,
            Quantity = request.Quantity,
            QuantityAfter = quantityAfter,
            Reason = request.Reason,
            ReferenceId = request.ReferenceId,
            RecordedByUserId = request.RecordedByUserId,
            CreatedAtUtc = DateTime.UtcNow
        };

        item.QuantityOnHand = quantityAfter;
        _db.InventoryMovements.Add(movement);
        await _db.SaveChangesAsync();

        return new InventoryMovementResponse(movement.Id, movement.MovementType, movement.Quantity, movement.QuantityAfter, movement.Reason, movement.CreatedAtUtc);
    }

    public async Task<List<InventoryMovementResponse>> GetMovementsAsync(Guid itemId)
    {
        return await _db.InventoryMovements
            .Where(m => m.InventoryItemId == itemId)
            .OrderByDescending(m => m.CreatedAtUtc)
            .Select(m => new InventoryMovementResponse(m.Id, m.MovementType, m.Quantity, m.QuantityAfter, m.Reason, m.CreatedAtUtc))
            .ToListAsync();
    }

    private static InventoryItemResponse ToResponse(InventoryItem i) =>
        new(i.Id, i.Name, i.Description, i.Category, i.SKU,
            i.QuantityOnHand, i.ReorderLevel, i.UnitCost, i.Unit,
            i.BranchId, i.Branch?.Name, i.ExpiresAtUtc, i.IsActive,
            i.QuantityOnHand <= i.ReorderLevel, i.CreatedAtUtc);
}
