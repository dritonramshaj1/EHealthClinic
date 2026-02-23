using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Mongo;
using EHealthClinic.Api.Mongo.Documents;
using Microsoft.AspNetCore.Http;
using MongoDB.Driver;

namespace EHealthClinic.Api.Services;

public sealed class AuditService : IAuditService
{
    private readonly IMongoContext _mongo;
    private readonly IHttpContextAccessor _http;
    private IMongoCollection<AuditLogDoc> Logs => _mongo.Collection<AuditLogDoc>("audit_logs");

    public AuditService(IMongoContext mongo, IHttpContextAccessor http)
    {
        _mongo = mongo;
        _http = http;
    }

    public async Task LogAsync(Guid? userId, string action, string? module = null,
        string? entityType = null, string? entityId = null,
        string? details = null, string? userEmail = null,
        string? userRole = null, string? ipAddress = null)
    {
        // Auto-populate from current HTTP context when not explicitly provided
        var principal = _http.HttpContext?.User;
        userEmail ??= principal?.FindFirstValue(JwtRegisteredClaimNames.Email)
                   ?? principal?.FindFirstValue("email")
                   ?? principal?.FindFirstValue(ClaimTypes.Email);
        userRole ??= principal?.FindFirstValue(ClaimTypes.Role);
        ipAddress ??= _http.HttpContext?.Connection?.RemoteIpAddress?.ToString();

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
        string? userId = null, string? userEmail = null, string? module = null,
        string? action = null, DateTime? from = null, DateTime? to = null, int limit = 100)
    {
        var filter = Builders<AuditLogDoc>.Filter.Empty;

        if (!string.IsNullOrEmpty(userId) && Guid.TryParse(userId, out var guidId))
            filter &= Builders<AuditLogDoc>.Filter.Eq(l => l.UserId, guidId);

        if (!string.IsNullOrEmpty(userEmail))
            filter &= Builders<AuditLogDoc>.Filter.Regex(l => l.UserEmail,
                new MongoDB.Bson.BsonRegularExpression(userEmail, "i"));

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
