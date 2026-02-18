namespace EHealthClinic.Api.Entities;

public sealed class Invoice
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = "";

    public Guid PatientId { get; set; }
    public PatientProfile Patient { get; set; } = default!;

    public Guid? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "EUR";

    // Draft | Issued | PartiallyPaid | Paid | Overdue | Cancelled | Refunded
    public string Status { get; set; } = "Draft";

    public string? Notes { get; set; }

    public DateTime IssuedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? DueAtUtc { get; set; }
    public DateTime? PaidAtUtc { get; set; }

    public Guid? CreatedByUserId { get; set; }

    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    public ICollection<InsuranceClaim> InsuranceClaims { get; set; } = new List<InsuranceClaim>();
}
