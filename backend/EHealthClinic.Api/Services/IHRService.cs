using EHealthClinic.Api.Dtos;

namespace EHealthClinic.Api.Services;

public interface IHRService
{
    // Shifts
    Task<List<StaffShiftResponse>> GetShiftsAsync(Guid? userId = null, Guid? branchId = null);
    Task<StaffShiftResponse> CreateShiftAsync(CreateStaffShiftRequest request);
    Task<StaffShiftResponse?> UpdateShiftStatusAsync(Guid id, string status);

    // Leave Requests
    Task<List<LeaveRequestResponse>> GetLeaveRequestsAsync(Guid? userId = null, string? status = null);
    Task<LeaveRequestResponse> CreateLeaveRequestAsync(CreateLeaveRequestRequest request);
    Task<LeaveRequestResponse?> ReviewLeaveRequestAsync(Guid id, ReviewLeaveRequest request);
}
