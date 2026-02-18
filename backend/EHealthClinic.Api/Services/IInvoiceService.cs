using EHealthClinic.Api.Dtos;

namespace EHealthClinic.Api.Services;

public interface IInvoiceService
{
    Task<List<InvoiceResponse>> GetAllAsync(Guid? patientId = null, string? status = null);
    Task<InvoiceResponse?> GetByIdAsync(Guid id);
    Task<InvoiceResponse> CreateAsync(CreateInvoiceRequest request);
    Task<InvoiceResponse?> UpdateStatusAsync(Guid id, string status);
    Task<InvoiceResponse?> AddItemAsync(Guid invoiceId, CreateInvoiceItemRequest request);
    Task<string> GenerateInvoiceNumberAsync();
}
