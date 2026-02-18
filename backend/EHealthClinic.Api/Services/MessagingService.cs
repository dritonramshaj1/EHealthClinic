using EHealthClinic.Api.Data;
using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Mongo;
using EHealthClinic.Api.Mongo.Documents;
using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;

namespace EHealthClinic.Api.Services;

public sealed class MessagingService : IMessagingService
{
    private readonly IMongoContext _mongo;
    private readonly ApplicationDbContext _db;
    private IMongoCollection<MessageDoc> Messages => _mongo.Collection<MessageDoc>("messages");

    public MessagingService(IMongoContext mongo, ApplicationDbContext db)
    {
        _mongo = mongo;
        _db = db;
    }

    public async Task<List<MessageResponse>> GetInboxAsync(Guid userId, int limit = 50)
    {
        var docs = await Messages
            .Find(m => m.RecipientId == userId && !m.IsDeletedByRecipient)
            .SortByDescending(m => m.CreatedAtUtc)
            .Limit(limit)
            .ToListAsync();

        var names = await GetUserNamesAsync(docs);
        return docs.Select(d => ToResponse(d, names)).ToList();
    }

    public async Task<List<MessageResponse>> GetSentAsync(Guid userId, int limit = 50)
    {
        var docs = await Messages
            .Find(m => m.SenderId == userId && !m.IsDeletedBySender)
            .SortByDescending(m => m.CreatedAtUtc)
            .Limit(limit)
            .ToListAsync();

        var names = await GetUserNamesAsync(docs);
        return docs.Select(d => ToResponse(d, names)).ToList();
    }

    public async Task<List<MessageResponse>> GetThreadAsync(Guid threadId)
    {
        var docs = await Messages
            .Find(m => m.ThreadId == threadId)
            .SortBy(m => m.CreatedAtUtc)
            .ToListAsync();

        var names = await GetUserNamesAsync(docs);
        return docs.Select(d => ToResponse(d, names)).ToList();
    }

    public async Task<MessageResponse> SendAsync(SendMessageRequest request)
    {
        var threadId = request.ThreadId ?? Guid.NewGuid();

        var senderName = await GetUserNameAsync(request.SenderId);
        var recipientName = await GetUserNameAsync(request.RecipientId);

        var doc = new MessageDoc
        {
            ThreadId = threadId,
            SenderId = request.SenderId,
            SenderName = senderName,
            RecipientId = request.RecipientId,
            RecipientName = recipientName,
            Subject = request.Subject,
            Body = request.Body,
            RelatedPatientId = request.RelatedPatientId,
            RelatedAppointmentId = request.RelatedAppointmentId,
            IsRead = false,
            CreatedAtUtc = DateTime.UtcNow
        };

        await Messages.InsertOneAsync(doc);
        return ToResponse(doc, null);
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

    private async Task<string?> GetUserNameAsync(Guid userId)
    {
        var u = await _db.Users.AsNoTracking()
            .Where(x => x.Id == userId)
            .Select(x => x.FullName)
            .FirstOrDefaultAsync();
        return u;
    }

    private async Task<Dictionary<Guid, string>> GetUserNamesAsync(List<MessageDoc> docs)
    {
        var ids = docs
            .SelectMany(m => new[] { m.SenderId, m.RecipientId })
            .Distinct()
            .Where(id => id != Guid.Empty)
            .ToHashSet();
        if (ids.Count == 0) return new Dictionary<Guid, string>();

        var list = await _db.Users.AsNoTracking()
            .Where(u => ids.Contains(u.Id))
            .Select(u => new { u.Id, u.FullName })
            .ToListAsync();
        return list.ToDictionary(x => x.Id, x => x.FullName ?? "");
    }

    private static MessageResponse ToResponse(MessageDoc m, Dictionary<Guid, string>? nameLookup = null)
    {
        var senderName = m.SenderName ?? (nameLookup != null && nameLookup.TryGetValue(m.SenderId, out var sn) ? sn : null);
        var recipientName = m.RecipientName ?? (nameLookup != null && nameLookup.TryGetValue(m.RecipientId, out var rn) ? rn : null);
        return new(m.Id!, m.ThreadId, m.SenderId, senderName, m.SenderRole,
            m.RecipientId, recipientName, m.Subject, m.Body,
            m.RelatedPatientId, m.RelatedAppointmentId,
            m.IsRead, m.ReadAtUtc, m.CreatedAtUtc);
    }
}
