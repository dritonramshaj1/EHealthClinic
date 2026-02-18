using EHealthClinic.Api.Dtos;

namespace EHealthClinic.Api.Services;

public interface IPrescriptionService
{
    Task<List<PrescriptionResponse>> GetAllAsync(Guid? patientId = null, Guid? doctorId = null);
    Task<PrescriptionResponse?> GetByIdAsync(Guid id);
    Task<PrescriptionResponse> CreateAsync(CreatePrescriptionRequest request);
    Task<PrescriptionResponse?> UpdateStatusAsync(Guid id, string status);
}
