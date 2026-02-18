namespace EHealthClinic.Api.Dtos;

public record CreatePrescriptionItemRequest(string MedicationName, string Dosage, string Frequency, int DurationDays, string? Instructions, int? Quantity);
public record UpdatePrescriptionStatusRequest(string Status);
public record CreatePrescriptionRequest(Guid AppointmentId, Guid DoctorId, Guid PatientId, string? Notes, DateTime? ExpiresAtUtc, List<CreatePrescriptionItemRequest> Items);
public record PrescriptionItemResponse(Guid Id, string MedicationName, string Dosage, string Frequency, int DurationDays, string? Instructions, int? Quantity);
public record PrescriptionResponse(
    Guid Id, Guid AppointmentId, Guid DoctorId, string DoctorName,
    Guid PatientId, string PatientName, string? PatientMRN,
    string Status, string? Notes, DateTime IssuedAtUtc, DateTime? ExpiresAtUtc,
    List<PrescriptionItemResponse> Items);
