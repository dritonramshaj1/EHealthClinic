using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EHealthClinic.Api.Mongo.Documents;

public sealed class MedicalRecordDoc
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public Guid PatientId { get; set; }

    public List<MedicalRecordEntry> Entries { get; set; } = new();

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed class MedicalRecordEntry
{
    public DateTime DateUtc { get; set; } = DateTime.UtcNow;
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? Diagnosis { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
}
