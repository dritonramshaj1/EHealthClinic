namespace EHealthClinic.Api.Dtos;

public record CreateInsuranceClaimRequest(Guid InvoiceId, Guid PatientId, string InsuranceCompany, string PolicyNumber, decimal ClaimAmount);
public record UpdateInsuranceClaimRequest(string Status, decimal? ApprovedAmount, string? ReferenceNumber, string? RejectionReason);
public record UpdateInsuranceClaimStatusRequest(string Status, decimal? ApprovedAmount, string? ReferenceNumber, string? RejectionReason);
public record InsuranceClaimResponse(
    Guid Id, Guid InvoiceId, Guid PatientId, string PatientName,
    string InsuranceCompany, string PolicyNumber, decimal ClaimAmount,
    decimal? ApprovedAmount, string Status, string? ReferenceNumber, string? RejectionReason,
    DateTime SubmittedAtUtc, DateTime? ResolvedAtUtc);
