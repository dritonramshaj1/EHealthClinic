using EHealthClinic.Api.Dtos;

namespace EHealthClinic.Api.Services;

public interface ILabService
{
    Task<List<LabOrderResponse>> GetOrdersAsync(Guid? patientId = null, Guid? doctorId = null, string? status = null);
    Task<LabOrderResponse?> GetOrderByIdAsync(Guid id);
    Task<LabOrderResponse> CreateOrderAsync(CreateLabOrderRequest request);
    Task<LabOrderResponse?> UpdateOrderStatusAsync(Guid id, string status);
    Task<LabResultResponse> AddResultAsync(Guid labOrderId, CreateLabResultRequest request);
}
