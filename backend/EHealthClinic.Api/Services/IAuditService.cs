using EHealthClinic.Api.Dtos;

namespace EHealthClinic.Api.Services;

public interface IAuditService
{
    Task LogAsync(Guid? userId, string action, string? module = null,
        string? entityType = null, string? entityId = null,
        string? details = null, string? userEmail = null,
        string? userRole = null, string? ipAddress = null);

    Task<List<AuditLogResponse>> GetLogsAsync(
        string? userId = null, string? module = null, string? action = null,
        DateTime? from = null, DateTime? to = null, int limit = 100);
}
