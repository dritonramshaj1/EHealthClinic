using EHealthClinic.Api.Mongo;
using EHealthClinic.Api.Mongo.Documents;
using MongoDB.Driver;

namespace EHealthClinic.Api.Services;

public sealed class MedicalRecordService : IMedicalRecordService
{
    private const string CollectionName = "medical_records";
    private readonly IMongoCollection<MedicalRecordDoc> _col;

    public MedicalRecordService(IMongoContext ctx)
    {
        _col = ctx.Collection<MedicalRecordDoc>(CollectionName);
    }

    public async Task<MedicalRecordDoc?> GetByPatientAsync(Guid patientId)
    {
        return await _col.Find(x => x.PatientId == patientId).FirstOrDefaultAsync();
    }

    public async Task UpsertEntryAsync(Guid patientId, MedicalRecordEntry entry)
    {
        var update = Builders<MedicalRecordDoc>.Update
            .Push(x => x.Entries, entry)
            .Set(x => x.UpdatedAtUtc, DateTime.UtcNow);

        await _col.UpdateOneAsync(
            filter: x => x.PatientId == patientId,
            update: update,
            options: new UpdateOptions { IsUpsert = true }
        );
    }
}
