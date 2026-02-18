using EHealthClinic.Api.Dtos;
using Microsoft.AspNetCore.Http;

namespace EHealthClinic.Api.Services;

public interface IDocumentService
{
    Task<List<PatientDocumentResponse>> GetPatientDocumentsAsync(Guid patientId);
    Task<PatientDocumentResponse> UploadAsync(Guid patientId, Guid uploadedByUserId, IFormFile file, string documentType, string? description);
    Task<(byte[] content, string contentType, string fileName)?> DownloadAsync(Guid documentId);
    Task<bool> DeleteAsync(Guid documentId);
}
