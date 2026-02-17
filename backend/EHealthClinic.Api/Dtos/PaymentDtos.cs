namespace EHealthClinic.Api.Dtos;

public sealed record CreatePaymentRequest(
    Guid AppointmentId,
    decimal Amount,
    string Currency = "EUR"
);

public sealed record UpdatePaymentStatusRequest(string Status);

public sealed record SimulatePayRequest(
    string PaymentMethod,
    string? CardNumber = null
);
