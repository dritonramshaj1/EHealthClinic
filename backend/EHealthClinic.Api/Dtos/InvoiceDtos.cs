namespace EHealthClinic.Api.Dtos;

public record CreateInvoiceItemRequest(string Description, int Quantity, decimal UnitPrice, Guid? ClinicServiceId = null);
public record UpdateInvoiceStatusRequest(string Status);
public record CreateInvoiceRequest(Guid PatientId, Guid? AppointmentId, decimal TaxAmount, string? Notes, DateTime? DueAtUtc, List<CreateInvoiceItemRequest>? Items = null);
public record InvoiceItemResponse(Guid Id, string Description, int Quantity, decimal UnitPrice, decimal LineTotal, Guid? ClinicServiceId, string? ServiceName);
public record InvoiceResponse(
    Guid Id, string InvoiceNumber, Guid PatientId, string PatientName, string? PatientMRN,
    Guid? AppointmentId, decimal Subtotal, decimal TaxAmount, decimal TotalAmount,
    string Currency, string Status, string? Notes,
    DateTime IssuedAtUtc, DateTime? DueAtUtc, DateTime? PaidAtUtc,
    List<InvoiceItemResponse> Items);
