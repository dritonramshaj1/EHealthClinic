using EHealthClinic.Api.Dtos;

namespace EHealthClinic.Api.Services;

public interface IQueueService
{
    Task<List<QueueEntryResponse>> GetTodayQueueAsync(Guid branchId);
    Task<QueueEntryResponse> AddToQueueAsync(CreateQueueEntryRequest request);
    Task<QueueEntryResponse?> UpdateStatusAsync(Guid id, string status);
    Task<int> GetNextQueueNumberAsync(Guid branchId);
}
