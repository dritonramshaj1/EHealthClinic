namespace EHealthClinic.Api.Entities;

public sealed class LabOrder
{
    public Guid Id { get; set; }

    public Guid AppointmentId { get; set; }
    public Appointment Appointment { get; set; } = default!;

    public Guid DoctorId { get; set; }
    public DoctorProfile Doctor { get; set; } = default!;

    public Guid PatientId { get; set; }
    public PatientProfile Patient { get; set; } = default!;

    // Ordered | SpecimenCollected | InProgress | Completed | Cancelled
    public string Status { get; set; } = "Ordered";

    // Routine | Urgent | Stat
    public string Priority { get; set; } = "Routine";

    public string? Notes { get; set; }

    public DateTime OrderedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAtUtc { get; set; }

    public ICollection<LabOrderTest> Tests { get; set; } = new List<LabOrderTest>();
    public ICollection<LabResult> Results { get; set; } = new List<LabResult>();
}
