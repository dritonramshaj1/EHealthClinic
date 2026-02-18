using EHealthClinic.Api.Data;
using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Services;

public sealed class HRService : IHRService
{
    private readonly ApplicationDbContext _db;

    public HRService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<StaffShiftResponse>> GetShiftsAsync(Guid? userId = null, Guid? branchId = null)
    {
        var q = _db.StaffShifts
            .Include(s => s.User)
            .Include(s => s.Branch)
            .AsQueryable();

        if (userId.HasValue) q = q.Where(s => s.UserId == userId.Value);
        if (branchId.HasValue) q = q.Where(s => s.BranchId == branchId.Value);

        return await q.OrderBy(s => s.ShiftStartUtc)
            .Select(s => ToShiftResponse(s))
            .ToListAsync();
    }

    public async Task<StaffShiftResponse> CreateShiftAsync(CreateStaffShiftRequest request)
    {
        var shift = new StaffShift
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            BranchId = request.BranchId,
            ShiftStartUtc = request.ShiftStartUtc,
            ShiftEndUtc = request.ShiftEndUtc,
            ShiftType = request.ShiftType,
            Status = "Scheduled",
            Notes = request.Notes,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.StaffShifts.Add(shift);
        await _db.SaveChangesAsync();

        return await _db.StaffShifts
            .Include(s => s.User).Include(s => s.Branch)
            .Where(s => s.Id == shift.Id)
            .Select(s => ToShiftResponse(s))
            .FirstAsync();
    }

    public async Task<StaffShiftResponse?> UpdateShiftStatusAsync(Guid id, string status)
    {
        var shift = await _db.StaffShifts.FindAsync(id);
        if (shift is null) return null;
        shift.Status = status;
        await _db.SaveChangesAsync();
        return await _db.StaffShifts
            .Include(s => s.User).Include(s => s.Branch)
            .Where(s => s.Id == id)
            .Select(s => ToShiftResponse(s))
            .FirstOrDefaultAsync();
    }

    public async Task<List<LeaveRequestResponse>> GetLeaveRequestsAsync(Guid? userId = null, string? status = null)
    {
        var q = _db.LeaveRequests.Include(l => l.User).AsQueryable();
        if (userId.HasValue) q = q.Where(l => l.UserId == userId.Value);
        if (!string.IsNullOrEmpty(status)) q = q.Where(l => l.Status == status);

        return await q.OrderByDescending(l => l.CreatedAtUtc)
            .Select(l => ToLeaveResponse(l))
            .ToListAsync();
    }

    public async Task<LeaveRequestResponse> CreateLeaveRequestAsync(CreateLeaveRequestRequest request)
    {
        var leave = new LeaveRequest
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            LeaveType = request.LeaveType,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Reason = request.Reason,
            Status = "Pending",
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.LeaveRequests.Add(leave);
        await _db.SaveChangesAsync();

        return await _db.LeaveRequests.Include(l => l.User)
            .Where(l => l.Id == leave.Id)
            .Select(l => ToLeaveResponse(l))
            .FirstAsync();
    }

    public async Task<LeaveRequestResponse?> ReviewLeaveRequestAsync(Guid id, ReviewLeaveRequest request)
    {
        var leave = await _db.LeaveRequests.FindAsync(id);
        if (leave is null) return null;

        leave.Status = request.Status;
        leave.ReviewedByUserId = request.ReviewedByUserId;
        leave.ReviewerNote = request.ReviewerNote;
        leave.ReviewedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return await _db.LeaveRequests.Include(l => l.User)
            .Where(l => l.Id == id)
            .Select(l => ToLeaveResponse(l))
            .FirstOrDefaultAsync();
    }

    private static StaffShiftResponse ToShiftResponse(StaffShift s)
    {
        var role = "Staff";
        return new(s.Id, s.UserId, s.User?.FullName ?? "", role,
            s.BranchId, s.Branch?.Name, s.ShiftStartUtc, s.ShiftEndUtc,
            s.ShiftType, s.Status, s.Notes, s.CreatedAtUtc);
    }

    private static LeaveRequestResponse ToLeaveResponse(LeaveRequest l) =>
        new(l.Id, l.UserId, l.User?.FullName ?? "",
            l.LeaveType, l.StartDate, l.EndDate, l.Reason,
            l.Status, l.ReviewerNote, l.CreatedAtUtc, l.ReviewedAtUtc);
}
