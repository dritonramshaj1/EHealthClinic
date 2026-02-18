using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Mongo;
using EHealthClinic.Api.Mongo.Documents;
using MongoDB.Driver;

namespace EHealthClinic.Api.Services;

public sealed class AuditService : IAuditService
{
    private readonly IMongoContext _mongo;
    private IMongoCollection<AuditLogDoc> Logs => _mongo.Collection<AuditLogDoc>("audit_logs");

    public AuditService(IMongoContext mongo)
    {
        _mongo = mongo;
    }

    public async Task LogAsync(Guid? userId, string action, string? module = null,
        string? entityType = null, string? entityId = null,
        string? details = null, string? userEmail = null,
        string? userRole = null, string? ipAddress = null)
    {
        var doc = new AuditLogDoc
        {
            UserId = userId,
            UserEmail = userEmail,
            UserRole = userRole,
            Action = action,
            Module = module,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            IpAddress = ipAddress,
            CreatedAtUtc = DateTime.UtcNow
        };

        await Logs.InsertOneAsync(doc);
    }

    public async Task<List<AuditLogResponse>> GetLogsAsync(
        string? userId = null, string? module = null, string? action = null,
        DateTime? from = null, DateTime? to = null, int limit = 100)
    {
        var filter = Builders<AuditLogDoc>.Filter.Empty;

        if (!string.IsNullOrEmpty(userId))
            filter &= Builders<AuditLogDoc>.Filter.Eq(l => l.UserId.ToString(), userId);

        if (!string.IsNullOrEmpty(module))
            filter &= Builders<AuditLogDoc>.Filter.Eq(l => l.Module, module);

        if (!string.IsNullOrEmpty(action))
            filter &= Builders<AuditLogDoc>.Filter.Eq(l => l.Action, action);

        if (from.HasValue)
            filter &= Builders<AuditLogDoc>.Filter.Gte(l => l.CreatedAtUtc, from.Value);

        if (to.HasValue)
            filter &= Builders<AuditLogDoc>.Filter.Lte(l => l.CreatedAtUtc, to.Value);

        var docs = await Logs
            .Find(filter)
            .SortByDescending(l => l.CreatedAtUtc)
            .Limit(limit)
            .ToListAsync();

        return docs.Select(l => new AuditLogResponse(
            l.Id!, l.UserId, l.UserEmail, l.UserRole,
            l.Action, l.Module, l.EntityType, l.EntityId,
            l.Details, l.IpAddress, l.CreatedAtUtc)).ToList();
    }
}
