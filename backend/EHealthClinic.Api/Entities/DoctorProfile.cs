namespace EHealthClinic.Api.Entities;

public sealed class DoctorProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = default!;

    public string Specialty { get; set; } = "";
    public string LicenseNumber { get; set; } = "";
    public string? Bio { get; set; }
    public int YearsOfExperience { get; set; } = 0;
    public string? Education { get; set; }
    public string? Certifications { get; set; }
    public string? Languages { get; set; }
    public decimal? ConsultationFee { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
