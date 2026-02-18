using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EHealthClinic.Api.Mongo.Documents;

/// <summary>
/// Rich audit log document stored in MongoDB collection "audit_logs".
/// Replaces the simpler ActivityLogDoc with more detailed tracking.
/// </summary>
public sealed class AuditLogDoc
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string? UserRole { get; set; }

    // Action performed (e.g. "CREATE", "UPDATE", "DELETE", "LOGIN", "EXPORT")
    public string Action { get; set; } = "";

    // Module (e.g. "appointments", "billing", "lab", "patients")
    public string? Module { get; set; }

    // Entity type (e.g. "Appointment", "Invoice", "LabOrder")
    public string? EntityType { get; set; }

    // Entity ID (as string for flexibility)
    public string? EntityId { get; set; }

    // Human-readable description
    public string? Details { get; set; }

    // JSON snapshot of changes (optional, for sensitive entities)
    public string? ChangeSummary { get; set; }

    // Request metadata
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
