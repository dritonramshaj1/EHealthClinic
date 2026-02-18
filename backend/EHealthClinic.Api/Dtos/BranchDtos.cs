namespace EHealthClinic.Api.Dtos;

public record CreateBranchRequest(string Name, string? Address, string? City, string? Phone, string? Email, bool IsMain = false);
public record UpdateBranchRequest(string Name, string? Address, string? City, string? Phone, string? Email, bool IsMain, bool IsActive);
public record BranchResponse(Guid Id, string Name, string? Address, string? City, string? Phone, string? Email, bool IsMain, bool IsActive, DateTime CreatedAtUtc);
