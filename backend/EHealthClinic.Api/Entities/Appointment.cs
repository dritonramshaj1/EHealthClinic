namespace EHealthClinic.Api.Entities;

public sealed class Appointment
{
    public Guid Id { get; set; }

    public Guid DoctorId { get; set; }
    public DoctorProfile Doctor { get; set; } = default!;

    public Guid PatientId { get; set; }
    public PatientProfile Patient { get; set; } = default!;

    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }

    public DateTime StartsAtUtc { get; set; }
    public DateTime EndsAtUtc { get; set; }

    // Scheduled | Confirmed | InProgress | Completed | Cancelled | NoShow
    public string Status { get; set; } = "Scheduled";

    // Scheduled | WalkIn | Emergency | FollowUp | Online
    public string Type { get; set; } = "Scheduled";

    // InPerson | Video | Phone
    public string? ConsultationType { get; set; }

    public string? Reason { get; set; }
    public string? Notes { get; set; }

    public Guid? InvoiceId { get; set; }
    public Invoice? Invoice { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public Guid? CreatedByUserId { get; set; }
}
