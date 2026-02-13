using EHealthClinic.Api.Mongo.Documents;

namespace EHealthClinic.Api.Services;

public interface IMedicalRecordService
{
    Task<MedicalRecordDoc?> GetByPatientAsync(Guid patientId);
    Task UpsertEntryAsync(Guid patientId, MedicalRecordEntry entry);
}
