using EHealthClinic.Api.Dtos;

namespace EHealthClinic.Api.Services;

public interface IMessagingService
{
    Task<List<MessageResponse>> GetInboxAsync(Guid userId, int limit = 50);
    Task<List<MessageResponse>> GetSentAsync(Guid userId, int limit = 50);
    Task<List<MessageResponse>> GetThreadAsync(Guid threadId);
    Task<MessageResponse> SendAsync(SendMessageRequest request);
    Task<bool> MarkAsReadAsync(string messageId, Guid userId);
    Task<int> GetUnreadCountAsync(Guid userId);
}
