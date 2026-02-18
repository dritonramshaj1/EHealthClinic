namespace EHealthClinic.Api.Dtos;

public record PatientDocumentResponse(
    Guid Id, Guid PatientId, string PatientName,
    Guid UploadedByUserId, string OriginalFileName,
    string ContentType, long FileSizeBytes,
    string DocumentType, string? Description,
    bool IsDeleted, DateTime UploadedAtUtc);
