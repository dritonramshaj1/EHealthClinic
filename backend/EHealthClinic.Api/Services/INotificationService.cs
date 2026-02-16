using EHealthClinic.Api.Mongo.Documents;

namespace EHealthClinic.Api.Services;

public interface INotificationService
{
    Task<List<NotificationDoc>> GetForUserAsync(Guid userId, int limit = 50);
    Task CreateAsync(Guid userId, string type, string message);
    Task MarkReadAsync(string id);
    Task MarkAllReadAsync(Guid userId);
}
