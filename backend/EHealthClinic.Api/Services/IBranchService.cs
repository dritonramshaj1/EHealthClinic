using EHealthClinic.Api.Dtos;

namespace EHealthClinic.Api.Services;

public interface IBranchService
{
    Task<List<BranchResponse>> GetAllAsync();
    Task<BranchResponse?> GetByIdAsync(Guid id);
    Task<BranchResponse> CreateAsync(CreateBranchRequest request);
    Task<BranchResponse?> UpdateAsync(Guid id, UpdateBranchRequest request);
    Task<bool> DeleteAsync(Guid id);
}
