namespace EHealthClinic.Api.Dtos;

public record CreateLabOrderTestRequest(string TestName, string? TestCode, string? SpecimenType);
public record CreateLabOrderRequest(Guid AppointmentId, Guid DoctorId, Guid PatientId, string Priority = "Routine", string? Notes = null, List<CreateLabOrderTestRequest>? Tests = null);
public record CreateLabResultRequest(Guid LabOrderTestId, string Value, string? Unit, string? ReferenceRange, string? Flag, bool IsAbnormal = false, string? Notes = null, Guid RecordedByUserId = default);
public record UpdateLabOrderStatusRequest(string Status);
public record LabOrderTestResponse(Guid Id, string TestName, string? TestCode, string? SpecimenType, string Status);
public record LabResultResponse(Guid Id, Guid LabOrderTestId, string TestName, string Value, string? Unit, string? ReferenceRange, string? Flag, bool IsAbnormal, string? Notes, DateTime ResultAtUtc);
public record LabOrderResponse(
    Guid Id, Guid AppointmentId, Guid DoctorId, string DoctorName,
    Guid PatientId, string PatientName, string? PatientMRN,
    string Status, string Priority, string? Notes,
    DateTime OrderedAtUtc, DateTime? CompletedAtUtc,
    List<LabOrderTestResponse> Tests, List<LabResultResponse> Results);
