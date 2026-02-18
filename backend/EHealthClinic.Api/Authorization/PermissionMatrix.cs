namespace EHealthClinic.Api.Authorization;

/// <summary>
/// Maps each role to its allowed set of permissions.
/// This is the single source of truth for RBAC.
/// Keep in sync with frontend/src/state/PermissionMatrix.js
/// </summary>
public static class PermissionMatrix
{
    public static readonly Dictionary<string, HashSet<string>> RolePermissions = new()
    {
        [Models.Roles.Admin] = new HashSet<string>
        {
            // Admin gets everything
            Permissions.PatientsRead,    Permissions.PatientsWrite,
            Permissions.AppointmentsRead,Permissions.AppointmentsWrite,
            Permissions.QueueRead,       Permissions.QueueWrite,
            Permissions.MedicalRecordsRead, Permissions.MedicalRecordsWrite,
            Permissions.PrescriptionsRead,  Permissions.PrescriptionsWrite,
            Permissions.LabRead,         Permissions.LabWrite,
            Permissions.BillingRead,     Permissions.BillingWrite,
            Permissions.InsuranceRead,   Permissions.InsuranceWrite,
            Permissions.InventoryRead,   Permissions.InventoryWrite,
            Permissions.HrRead,          Permissions.HrWrite,
            Permissions.DocumentsRead,   Permissions.DocumentsWrite,
            Permissions.MessagesRead,    Permissions.MessagesWrite,
            Permissions.ReportsRead,
            Permissions.UsersRead,       Permissions.UsersWrite,
            Permissions.BranchesRead,    Permissions.BranchesWrite,
            Permissions.AuditRead,
            Permissions.SettingsRead,    Permissions.SettingsWrite,
            Permissions.NotificationsRead, Permissions.NotificationsWrite,
        },

        [Models.Roles.Doctor] = new HashSet<string>
        {
            Permissions.PatientsRead,
            Permissions.AppointmentsRead, Permissions.AppointmentsWrite,
            Permissions.QueueRead,
            Permissions.MedicalRecordsRead, Permissions.MedicalRecordsWrite,
            Permissions.PrescriptionsRead,  Permissions.PrescriptionsWrite,
            Permissions.LabRead,            Permissions.LabWrite,
            Permissions.BillingRead,
            Permissions.InsuranceRead,
            Permissions.DocumentsRead,      Permissions.DocumentsWrite,
            Permissions.MessagesRead,       Permissions.MessagesWrite,
            Permissions.ReportsRead,
            Permissions.HrRead, // so Doctor can see Leave Requests and submit own leave
            Permissions.NotificationsRead,
        },

        [Models.Roles.Patient] = new HashSet<string>
        {
            Permissions.AppointmentsRead,
            Permissions.MedicalRecordsRead,
            Permissions.PrescriptionsRead,
            Permissions.LabRead,
            Permissions.BillingRead,
            Permissions.InsuranceRead,
            Permissions.DocumentsRead,
            Permissions.MessagesRead, Permissions.MessagesWrite,
            Permissions.NotificationsRead,
        },

        [Models.Roles.Receptionist] = new HashSet<string>
        {
            Permissions.PatientsRead,    Permissions.PatientsWrite,
            Permissions.AppointmentsRead, Permissions.AppointmentsWrite,
            Permissions.QueueRead,        Permissions.QueueWrite,
            Permissions.BillingRead,      Permissions.BillingWrite,
            Permissions.InsuranceRead,
            Permissions.DocumentsRead,    Permissions.DocumentsWrite,
            Permissions.MessagesRead,     Permissions.MessagesWrite,
            Permissions.NotificationsRead,
        },

        [Models.Roles.LabTechnician] = new HashSet<string>
        {
            Permissions.PatientsRead,
            Permissions.LabRead,  Permissions.LabWrite,
            Permissions.DocumentsRead,
            Permissions.MessagesRead, Permissions.MessagesWrite,
            Permissions.NotificationsRead,
        },

        [Models.Roles.Pharmacist] = new HashSet<string>
        {
            Permissions.PatientsRead,
            Permissions.PrescriptionsRead, Permissions.PrescriptionsWrite,
            Permissions.InventoryRead,     Permissions.InventoryWrite,
            Permissions.MessagesRead,      Permissions.MessagesWrite,
            Permissions.NotificationsRead,
        },

        [Models.Roles.HRManager] = new HashSet<string>
        {
            Permissions.HrRead,   Permissions.HrWrite,
            Permissions.UsersRead,
            Permissions.ReportsRead,
            Permissions.MessagesRead, Permissions.MessagesWrite,
            Permissions.NotificationsRead,
        },
    };

    public static bool HasPermission(string role, string permission)
    {
        return RolePermissions.TryGetValue(role, out var perms) && perms.Contains(permission);
    }

    public static bool HasAnyPermission(IEnumerable<string> roles, string permission)
    {
        return roles.Any(r => HasPermission(r, permission));
    }
}
