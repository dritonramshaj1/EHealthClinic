using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EHealthClinic.Api.Mongo.Documents;

public sealed class ActivityLogDoc
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public Guid? UserId { get; set; }
    public string Action { get; set; } = "";
    public string? Details { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
