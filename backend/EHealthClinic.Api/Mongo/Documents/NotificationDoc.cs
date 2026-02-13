using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EHealthClinic.Api.Mongo.Documents;

public sealed class NotificationDoc
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public Guid UserId { get; set; }
    public string Type { get; set; } = "Info";
    public string Message { get; set; } = "";
    public bool Read { get; set; } = false;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
