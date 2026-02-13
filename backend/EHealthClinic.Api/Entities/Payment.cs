namespace EHealthClinic.Api.Entities;

public sealed class Payment
{
    public Guid Id { get; set; }

    public Guid AppointmentId { get; set; }
    public Appointment Appointment { get; set; } = default!;

    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public string Status { get; set; } = "Pending"; // Pending, Paid, Failed

    public string? Provider { get; set; } // e.g. Stripe (later)
    public string? ExternalReference { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
