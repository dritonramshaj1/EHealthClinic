namespace EHealthClinic.Api.Entities;

public sealed class PatientDocument
{
    public Guid Id { get; set; }

    public Guid PatientId { get; set; }
    public PatientProfile Patient { get; set; } = default!;

    public Guid UploadedByUserId { get; set; }

    public string FileName { get; set; } = "";
    public string OriginalFileName { get; set; } = "";
    public string ContentType { get; set; } = "";
    public long FileSizeBytes { get; set; }
    public string StoragePath { get; set; } = "";

    // Lab | Prescription | Referral | ID | Insurance | Consent | Radiology | Other
    public string DocumentType { get; set; } = "Other";

    public string? Description { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;
}
