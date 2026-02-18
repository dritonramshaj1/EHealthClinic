namespace EHealthClinic.Api.Models;

public static class Roles
{
    public const string Admin         = "Admin";
    public const string Doctor        = "Doctor";
    public const string Patient       = "Patient";
    public const string Receptionist  = "Receptionist";
    public const string LabTechnician = "LabTechnician";
    public const string Pharmacist    = "Pharmacist";
    public const string HRManager     = "HRManager";

    public static readonly string[] All =
    [
        Admin, Doctor, Patient,
        Receptionist, LabTechnician, Pharmacist, HRManager
    ];
}
