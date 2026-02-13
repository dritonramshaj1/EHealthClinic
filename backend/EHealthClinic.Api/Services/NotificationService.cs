using EHealthClinic.Api.Mongo;
using EHealthClinic.Api.Mongo.Documents;
using MongoDB.Driver;

namespace EHealthClinic.Api.Services;

public sealed class NotificationService : INotificationService
{
    private const string CollectionName = "notifications";
    private readonly IMongoCollection<NotificationDoc> _col;

    public NotificationService(IMongoContext ctx)
    {
        _col = ctx.Collection<NotificationDoc>(CollectionName);
    }

    public async Task<List<NotificationDoc>> GetForUserAsync(Guid userId, int limit = 50)
    {
        return await _col.Find(x => x.UserId == userId)
            .SortByDescending(x => x.CreatedAtUtc)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task CreateAsync(Guid userId, string type, string message)
    {
        await _col.InsertOneAsync(new NotificationDoc
        {
            UserId = userId,
            Type = type,
            Message = message,
            CreatedAtUtc = DateTime.UtcNow
        });
    }

    public async Task MarkReadAsync(string id)
    {
        await _col.UpdateOneAsync(x => x.Id == id, Builders<NotificationDoc>.Update.Set(x => x.Read, true));
    }
}
