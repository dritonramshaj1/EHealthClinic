namespace EHealthClinic.Api.Entities;

public sealed class QueueEntry
{
    public Guid Id { get; set; }

    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = default!;

    public Guid PatientId { get; set; }
    public PatientProfile Patient { get; set; } = default!;

    public Guid? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public int QueueNumber { get; set; }

    // Waiting | Called | InProgress | Done | Skipped
    public string Status { get; set; } = "Waiting";

    // Normal | Urgent | Emergency
    public string Priority { get; set; } = "Normal";

    public string? Notes { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? CalledAtUtc { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
}
