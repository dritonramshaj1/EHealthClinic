namespace EHealthClinic.Api.Dtos;

public record SendMessageRequest(Guid SenderId, Guid RecipientId, string Subject, string Body, Guid? RelatedPatientId = null, Guid? RelatedAppointmentId = null, Guid? ThreadId = null);
public record MessageResponse(
    string Id, Guid ThreadId, Guid SenderId, string? SenderName, string? SenderRole,
    Guid RecipientId, string? RecipientName, string Subject, string Body,
    Guid? RelatedPatientId, Guid? RelatedAppointmentId,
    bool IsRead, DateTime? ReadAtUtc, DateTime CreatedAtUtc);
