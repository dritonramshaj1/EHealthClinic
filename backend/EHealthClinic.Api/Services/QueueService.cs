using EHealthClinic.Api.Data;
using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Services;

public sealed class QueueService : IQueueService
{
    private readonly ApplicationDbContext _db;

    public QueueService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<QueueEntryResponse>> GetTodayQueueAsync(Guid branchId)
    {
        var todayUtc = DateTime.UtcNow.Date;
        return await _db.QueueEntries
            .Include(q => q.Branch)
            .Include(q => q.Patient).ThenInclude(p => p.User)
            .Where(q => q.BranchId == branchId && q.CreatedAtUtc.Date == todayUtc)
            .OrderBy(q => q.QueueNumber)
            .Select(q => ToResponse(q))
            .ToListAsync();
    }

    public async Task<QueueEntryResponse> AddToQueueAsync(CreateQueueEntryRequest request)
    {
        var nextNumber = await GetNextQueueNumberAsync(request.BranchId);

        var entry = new QueueEntry
        {
            Id = Guid.NewGuid(),
            BranchId = request.BranchId,
            PatientId = request.PatientId,
            AppointmentId = request.AppointmentId,
            QueueNumber = nextNumber,
            Status = "Waiting",
            Priority = request.Priority,
            Notes = request.Notes,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.QueueEntries.Add(entry);
        await _db.SaveChangesAsync();

        return await _db.QueueEntries
            .Include(q => q.Branch)
            .Include(q => q.Patient).ThenInclude(p => p.User)
            .Where(q => q.Id == entry.Id)
            .Select(q => ToResponse(q))
            .FirstAsync();
    }

    public async Task<QueueEntryResponse?> UpdateStatusAsync(Guid id, string status)
    {
        var entry = await _db.QueueEntries
            .Include(q => q.Branch)
            .Include(q => q.Patient).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (entry is null) return null;

        entry.Status = status;
        if (status == "Called") entry.CalledAtUtc = DateTime.UtcNow;
        if (status == "InProgress") entry.StartedAtUtc = DateTime.UtcNow;
        if (status == "Done" || status == "Skipped") entry.CompletedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ToResponse(entry);
    }

    public async Task<int> GetNextQueueNumberAsync(Guid branchId)
    {
        var todayUtc = DateTime.UtcNow.Date;
        var maxNumber = await _db.QueueEntries
            .Where(q => q.BranchId == branchId && q.CreatedAtUtc.Date == todayUtc)
            .MaxAsync(q => (int?)q.QueueNumber) ?? 0;
        return maxNumber + 1;
    }

    private static QueueEntryResponse ToResponse(QueueEntry q) =>
        new(q.Id, q.BranchId, q.Branch?.Name ?? "",
            q.PatientId, q.Patient?.User?.FullName ?? "", q.Patient?.MRN,
            q.AppointmentId, q.QueueNumber, q.Status, q.Priority,
            q.Notes, q.CreatedAtUtc, q.CalledAtUtc, q.CompletedAtUtc);
}
