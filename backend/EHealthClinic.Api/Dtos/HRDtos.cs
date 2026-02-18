namespace EHealthClinic.Api.Dtos;

public record CreateStaffShiftRequest(Guid UserId, Guid? BranchId, DateTime ShiftStartUtc, DateTime ShiftEndUtc, string ShiftType = "Regular", string? Notes = null);
public record UpdateShiftStatusRequest(string Status);
public record StaffShiftResponse(Guid Id, Guid UserId, string UserName, string UserRole, Guid? BranchId, string? BranchName, DateTime ShiftStartUtc, DateTime ShiftEndUtc, string ShiftType, string Status, string? Notes, DateTime CreatedAtUtc);

public record CreateLeaveRequestRequest(Guid UserId, string LeaveType, DateOnly StartDate, DateOnly EndDate, string? Reason);
public record ReviewLeaveRequest(string Status, string? ReviewerNote, Guid ReviewedByUserId);
public record LeaveRequestResponse(Guid Id, Guid UserId, string UserName, string LeaveType, DateOnly StartDate, DateOnly EndDate, string? Reason, string Status, string? ReviewerNote, DateTime CreatedAtUtc, DateTime? ReviewedAtUtc);
