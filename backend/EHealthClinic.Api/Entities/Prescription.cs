namespace EHealthClinic.Api.Entities;

public sealed class Prescription
{
    public Guid Id { get; set; }

    public Guid AppointmentId { get; set; }
    public Appointment Appointment { get; set; } = default!;

    public Guid DoctorId { get; set; }
    public DoctorProfile Doctor { get; set; } = default!;

    public Guid PatientId { get; set; }
    public PatientProfile Patient { get; set; } = default!;

    // Active | Dispensed | Cancelled | Expired
    public string Status { get; set; } = "Active";

    public string? Notes { get; set; }

    public DateTime IssuedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAtUtc { get; set; }

    public ICollection<PrescriptionItem> Items { get; set; } = new List<PrescriptionItem>();
}
