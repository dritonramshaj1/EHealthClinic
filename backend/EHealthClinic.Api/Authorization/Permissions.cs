namespace EHealthClinic.Api.Authorization;

/// <summary>
/// All permission strings used across the application.
/// Format: "module.action"
/// </summary>
public static class Permissions
{
    // Patients
    public const string PatientsRead    = "patients.read";
    public const string PatientsWrite   = "patients.write";

    // Appointments
    public const string AppointmentsRead  = "appointments.read";
    public const string AppointmentsWrite = "appointments.write";

    // Queue
    public const string QueueRead  = "queue.read";
    public const string QueueWrite = "queue.write";

    // Medical Records (EMR)
    public const string MedicalRecordsRead  = "medical-records.read";
    public const string MedicalRecordsWrite = "medical-records.write";

    // Prescriptions
    public const string PrescriptionsRead  = "prescriptions.read";
    public const string PrescriptionsWrite = "prescriptions.write";

    // Laboratory
    public const string LabRead  = "lab.read";
    public const string LabWrite = "lab.write";

    // Billing / Invoices
    public const string BillingRead  = "billing.read";
    public const string BillingWrite = "billing.write";

    // Insurance
    public const string InsuranceRead  = "insurance.read";
    public const string InsuranceWrite = "insurance.write";

    // Inventory
    public const string InventoryRead  = "inventory.read";
    public const string InventoryWrite = "inventory.write";

    // HR
    public const string HrRead  = "hr.read";
    public const string HrWrite = "hr.write";

    // Documents
    public const string DocumentsRead  = "documents.read";
    public const string DocumentsWrite = "documents.write";

    // Messaging
    public const string MessagesRead  = "messages.read";
    public const string MessagesWrite = "messages.write";

    // Reports / Analytics
    public const string ReportsRead = "reports.read";

    // Users Management
    public const string UsersRead  = "users.read";
    public const string UsersWrite = "users.write";

    // Branches
    public const string BranchesRead  = "branches.read";
    public const string BranchesWrite = "branches.write";

    // Audit Logs
    public const string AuditRead = "audit.read";

    // Settings
    public const string SettingsRead  = "settings.read";
    public const string SettingsWrite = "settings.write";

    // Notifications
    public const string NotificationsRead  = "notifications.read";
    public const string NotificationsWrite = "notifications.write";
}
