namespace EHealthClinic.Api.Entities;

public sealed class LeaveRequest
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public AppUser User { get; set; } = default!;

    // Annual | Sick | Emergency | Maternity | Unpaid | Other
    public string LeaveType { get; set; } = "Annual";

    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }

    public string? Reason { get; set; }

    // Pending | Approved | Rejected | Cancelled
    public string Status { get; set; } = "Pending";

    public Guid? ReviewedByUserId { get; set; }
    public string? ReviewerNote { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAtUtc { get; set; }
}
