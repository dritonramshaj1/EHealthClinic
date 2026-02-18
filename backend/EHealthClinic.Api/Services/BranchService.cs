using EHealthClinic.Api.Data;
using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Services;

public sealed class BranchService : IBranchService
{
    private readonly ApplicationDbContext _db;

    public BranchService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<BranchResponse>> GetAllAsync()
    {
        return await _db.Branches
            .OrderBy(b => b.Name)
            .Select(b => ToResponse(b))
            .ToListAsync();
    }

    public async Task<BranchResponse?> GetByIdAsync(Guid id)
    {
        var b = await _db.Branches.FindAsync(id);
        return b is null ? null : ToResponse(b);
    }

    public async Task<BranchResponse> CreateAsync(CreateBranchRequest request)
    {
        var branch = new Branch
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Address = request.Address,
            City = request.City,
            Phone = request.Phone,
            Email = request.Email,
            IsMain = request.IsMain,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Branches.Add(branch);
        await _db.SaveChangesAsync();
        return ToResponse(branch);
    }

    public async Task<BranchResponse?> UpdateAsync(Guid id, UpdateBranchRequest request)
    {
        var branch = await _db.Branches.FindAsync(id);
        if (branch is null) return null;

        branch.Name = request.Name;
        branch.Address = request.Address;
        branch.City = request.City;
        branch.Phone = request.Phone;
        branch.Email = request.Email;
        branch.IsMain = request.IsMain;
        branch.IsActive = request.IsActive;

        await _db.SaveChangesAsync();
        return ToResponse(branch);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var branch = await _db.Branches.FindAsync(id);
        if (branch is null) return false;

        branch.IsActive = false;
        await _db.SaveChangesAsync();
        return true;
    }

    private static BranchResponse ToResponse(Branch b) =>
        new(b.Id, b.Name, b.Address, b.City, b.Phone, b.Email, b.IsMain, b.IsActive, b.CreatedAtUtc);
}
