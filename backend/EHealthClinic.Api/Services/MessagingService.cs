using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Mongo;
using EHealthClinic.Api.Mongo.Documents;
using MongoDB.Driver;

namespace EHealthClinic.Api.Services;

public sealed class MessagingService : IMessagingService
{
    private readonly IMongoContext _mongo;
    private IMongoCollection<MessageDoc> Messages => _mongo.Collection<MessageDoc>("messages");

    public MessagingService(IMongoContext mongo)
    {
        _mongo = mongo;
    }

    public async Task<List<MessageResponse>> GetInboxAsync(Guid userId, int limit = 50)
    {
        var docs = await Messages
            .Find(m => m.RecipientId == userId && !m.IsDeletedByRecipient)
            .SortByDescending(m => m.CreatedAtUtc)
            .Limit(limit)
            .ToListAsync();

        return docs.Select(ToResponse).ToList();
    }

    public async Task<List<MessageResponse>> GetSentAsync(Guid userId, int limit = 50)
    {
        var docs = await Messages
            .Find(m => m.SenderId == userId && !m.IsDeletedBySender)
            .SortByDescending(m => m.CreatedAtUtc)
            .Limit(limit)
            .ToListAsync();

        return docs.Select(ToResponse).ToList();
    }

    public async Task<List<MessageResponse>> GetThreadAsync(Guid threadId)
    {
        var docs = await Messages
            .Find(m => m.ThreadId == threadId)
            .SortBy(m => m.CreatedAtUtc)
            .ToListAsync();

        return docs.Select(ToResponse).ToList();
    }

    public async Task<MessageResponse> SendAsync(SendMessageRequest request)
    {
        var threadId = request.ThreadId ?? Guid.NewGuid();

        var doc = new MessageDoc
        {
            ThreadId = threadId,
            SenderId = request.SenderId,
            RecipientId = request.RecipientId,
            Subject = request.Subject,
            Body = request.Body,
            RelatedPatientId = request.RelatedPatientId,
            RelatedAppointmentId = request.RelatedAppointmentId,
            IsRead = false,
            CreatedAtUtc = DateTime.UtcNow
        };

        await Messages.InsertOneAsync(doc);
        return ToResponse(doc);
    }

    public async Task<bool> MarkAsReadAsync(string messageId, Guid userId)
    {
        var update = Builders<MessageDoc>.Update
            .Set(m => m.IsRead, true)
            .Set(m => m.ReadAtUtc, DateTime.UtcNow);

        var result = await Messages.UpdateOneAsync(
            m => m.Id == messageId && m.RecipientId == userId,
            update);

        return result.ModifiedCount > 0;
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return (int)await Messages.CountDocumentsAsync(
            m => m.RecipientId == userId && !m.IsRead && !m.IsDeletedByRecipient);
    }

    private static MessageResponse ToResponse(MessageDoc m) =>
        new(m.Id!, m.ThreadId, m.SenderId, m.SenderName, m.SenderRole,
            m.RecipientId, m.RecipientName, m.Subject, m.Body,
            m.RelatedPatientId, m.RelatedAppointmentId,
            m.IsRead, m.ReadAtUtc, m.CreatedAtUtc);
}
