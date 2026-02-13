namespace EHealthClinic.Api.Dtos;

public sealed record CreateAppointmentRequest(
    Guid DoctorId,
    Guid PatientId,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc,
    string? Reason
);

public sealed record UpdateAppointmentStatusRequest(string Status);
