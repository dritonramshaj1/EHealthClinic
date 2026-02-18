namespace EHealthClinic.Api.Entities;

public sealed class PatientProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = default!;

    // Medical Record Number — auto-generated (e.g. KL-2026-001284)
    public string? MRN { get; set; }

    public DateOnly? DateOfBirth { get; set; }
    public string BloodType { get; set; } = "";
    public string? Allergies { get; set; }

    // Contact & address
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }

    // Emergency contact
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }

    // Insurance
    public string? InsuranceCompany { get; set; }
    public string? InsurancePolicyNumber { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<PatientDocument> Documents { get; set; } = new List<PatientDocument>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
