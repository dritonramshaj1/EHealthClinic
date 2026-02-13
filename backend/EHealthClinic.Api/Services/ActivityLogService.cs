using EHealthClinic.Api.Mongo;
using EHealthClinic.Api.Mongo.Documents;
using MongoDB.Driver;

namespace EHealthClinic.Api.Services;

public sealed class ActivityLogService : IActivityLogService
{
    private const string CollectionName = "activity_logs";
    private readonly IMongoCollection<ActivityLogDoc> _col;

    public ActivityLogService(IMongoContext ctx)
    {
        _col = ctx.Collection<ActivityLogDoc>(CollectionName);
    }

    public async Task LogAsync(Guid? userId, string action, string? details = null)
    {
        await _col.InsertOneAsync(new ActivityLogDoc
        {
            UserId = userId,
            Action = action,
            Details = details,
            CreatedAtUtc = DateTime.UtcNow
        });
    }
}
