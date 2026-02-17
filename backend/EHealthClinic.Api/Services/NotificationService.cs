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

    public async Task<List<NotificationDoc>> GetForUserAsync(Guid userId, int limit = 50, string? type = null)
    {
        var filter = Builders<NotificationDoc>.Filter.Eq(x => x.UserId, userId);
        if (!string.IsNullOrWhiteSpace(type))
            filter &= Builders<NotificationDoc>.Filter.Eq(x => x.Type, type);

        return await _col.Find(filter)
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
        var now = DateTime.UtcNow;
        await _col.UpdateOneAsync(x => x.Id == id,
            Builders<NotificationDoc>.Update
                .Set(x => x.Read, true)
                .Set(x => x.ReadAtUtc, now));
    }

    public async Task MarkAllReadAsync(Guid userId)
    {
        var now = DateTime.UtcNow;
        await _col.UpdateManyAsync(
            x => x.UserId == userId && !x.Read,
            Builders<NotificationDoc>.Update
                .Set(x => x.Read, true)
                .Set(x => x.ReadAtUtc, now));
    }
}
