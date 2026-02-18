namespace EHealthClinic.Api.Dtos;

public record CreateQueueEntryRequest(Guid BranchId, Guid PatientId, Guid? AppointmentId, string Priority = "Normal", string? Notes = null);
public record UpdateQueueStatusRequest(string Status);
public record QueueStatsResponse(int Waiting, int Called, int InProgress, int Done, int Skipped, int Total);
public record QueueEntryResponse(
    Guid Id, Guid BranchId, string BranchName,
    Guid PatientId, string PatientName, string? PatientMRN,
    Guid? AppointmentId, int QueueNumber, string Status, string Priority,
    string? Notes, DateTime CreatedAtUtc, DateTime? CalledAtUtc, DateTime? CompletedAtUtc);
