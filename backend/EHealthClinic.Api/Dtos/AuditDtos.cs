namespace EHealthClinic.Api.Dtos;

public record AuditLogResponse(
    string Id, Guid? UserId, string? UserEmail, string? UserRole,
    string Action, string? Module, string? EntityType, string? EntityId,
    string? Details, string? IpAddress, DateTime CreatedAtUtc);
