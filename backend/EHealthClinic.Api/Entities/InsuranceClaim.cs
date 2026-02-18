namespace EHealthClinic.Api.Entities;

public sealed class InsuranceClaim
{
    public Guid Id { get; set; }

    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = default!;

    public Guid PatientId { get; set; }
    public PatientProfile Patient { get; set; } = default!;

    public string InsuranceCompany { get; set; } = "";
    public string PolicyNumber { get; set; } = "";

    public decimal ClaimAmount { get; set; }
    public decimal? ApprovedAmount { get; set; }

    // Submitted | InReview | Approved | Rejected | Paid
    public string Status { get; set; } = "Submitted";

    public string? ReferenceNumber { get; set; }
    public string? RejectionReason { get; set; }

    public DateTime SubmittedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAtUtc { get; set; }
}
