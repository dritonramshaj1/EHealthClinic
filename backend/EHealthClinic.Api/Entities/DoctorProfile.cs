namespace EHealthClinic.Api.Entities;

public sealed class DoctorProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = default!;

    public string Specialty { get; set; } = "";
    public string LicenseNumber { get; set; } = "";

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
