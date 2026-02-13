namespace EHealthClinic.Api.Services;

public interface IActivityLogService
{
    Task LogAsync(Guid? userId, string action, string? details = null);
}
