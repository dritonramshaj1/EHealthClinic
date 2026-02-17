namespace EHealthClinic.Api.Dtos;

public sealed record CreateUserRequest(
    string FullName,
    string Email,
    string Password,
    string Role,
    string? Specialty,
    string? LicenseNumber,
    string? Bio,
    int? YearsOfExperience,
    string? Education,
    string? Certifications,
    string? Languages,
    decimal? ConsultationFee,
    string? BloodType,
    string? DateOfBirth,
    string? Allergies
);

public sealed record UpdateUserRequest(
    string? FullName,
    string? Email,
    string? Specialty,
    string? LicenseNumber,
    string? Bio,
    int? YearsOfExperience,
    string? Education,
    string? Certifications,
    string? Languages,
    decimal? ConsultationFee,
    string? BloodType,
    string? DateOfBirth,
    string? Allergies
);
