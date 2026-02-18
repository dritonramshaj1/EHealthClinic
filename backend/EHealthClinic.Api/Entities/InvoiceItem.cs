namespace EHealthClinic.Api.Entities;

public sealed class InvoiceItem
{
    public Guid Id { get; set; }

    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = default!;

    public Guid? ClinicServiceId { get; set; }
    public ClinicService? ClinicService { get; set; }

    public string Description { get; set; } = "";
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}
