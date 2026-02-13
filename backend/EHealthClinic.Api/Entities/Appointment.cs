namespace EHealthClinic.Api.Entities;

public sealed class Appointment
{
    public Guid Id { get; set; }

    public Guid DoctorId { get; set; }
    public DoctorProfile Doctor { get; set; } = default!;

    public Guid PatientId { get; set; }
    public PatientProfile Patient { get; set; } = default!;

    public DateTime StartsAtUtc { get; set; }
    public DateTime EndsAtUtc { get; set; }

    public string Status { get; set; } = "Scheduled"; // Scheduled, Completed, Cancelled
    public string? Reason { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
