namespace EHealthClinic.Api.Entities;

public sealed class StaffShift
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public AppUser User { get; set; } = default!;

    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }

    public DateTime ShiftStartUtc { get; set; }
    public DateTime ShiftEndUtc { get; set; }

    // Regular | OnCall | Overtime | Night
    public string ShiftType { get; set; } = "Regular";

    // Scheduled | Active | Completed | Cancelled
    public string Status { get; set; } = "Scheduled";

    public string? Notes { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
