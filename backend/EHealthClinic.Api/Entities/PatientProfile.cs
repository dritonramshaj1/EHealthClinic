namespace EHealthClinic.Api.Entities;

public sealed class PatientProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = default!;

    public DateOnly? DateOfBirth { get; set; }
    public string BloodType { get; set; } = "";
    public string? Allergies { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
