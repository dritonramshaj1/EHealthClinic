using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EHealthClinic.Api.Mongo.Documents;

/// <summary>
/// Internal messaging document stored in MongoDB collection "messages".
/// Supports thread-based conversations between staff members.
/// </summary>
public sealed class MessageDoc
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    // Thread groups related messages (conversation ID)
    public Guid ThreadId { get; set; }

    public Guid SenderId { get; set; }
    public string? SenderName { get; set; }
    public string? SenderRole { get; set; }

    public Guid RecipientId { get; set; }
    public string? RecipientName { get; set; }

    public string Subject { get; set; } = "";
    public string Body { get; set; } = "";

    // Optional: reference to a patient or appointment
    public Guid? RelatedPatientId { get; set; }
    public Guid? RelatedAppointmentId { get; set; }

    public bool IsRead { get; set; } = false;
    public DateTime? ReadAtUtc { get; set; }

    public bool IsDeletedBySender { get; set; } = false;
    public bool IsDeletedByRecipient { get; set; } = false;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
