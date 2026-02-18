using EHealthClinic.Api.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Data;

public sealed class ApplicationDbContext : IdentityDbContext<AppUser, Microsoft.AspNetCore.Identity.IdentityRole<Guid>, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    // ── Existing ──────────────────────────────────────────
    public DbSet<DoctorProfile> Doctors => Set<DoctorProfile>();
    public DbSet<PatientProfile> Patients => Set<PatientProfile>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // ── New Enterprise Entities ───────────────────────────
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<QueueEntry> QueueEntries => Set<QueueEntry>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<PrescriptionItem> PrescriptionItems => Set<PrescriptionItem>();
    public DbSet<LabOrder> LabOrders => Set<LabOrder>();
    public DbSet<LabOrderTest> LabOrderTests => Set<LabOrderTest>();
    public DbSet<LabResult> LabResults => Set<LabResult>();
    public DbSet<ClinicService> ClinicServices => Set<ClinicService>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<InsuranceClaim> InsuranceClaims => Set<InsuranceClaim>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();
    public DbSet<StaffShift> StaffShifts => Set<StaffShift>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<PatientDocument> PatientDocuments => Set<PatientDocument>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ── EXISTING ─────────────────────────────────────

        builder.Entity<DoctorProfile>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.UserId).IsUnique();
            b.Property(x => x.Specialty).HasMaxLength(150);
            b.Property(x => x.Bio).HasMaxLength(1000);
            b.Property(x => x.Education).HasMaxLength(500);
            b.Property(x => x.Certifications).HasMaxLength(500);
            b.Property(x => x.Languages).HasMaxLength(200);
            b.Property(x => x.ConsultationFee).HasPrecision(10, 2);
        });

        builder.Entity<PatientProfile>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.UserId).IsUnique();
            b.Property(x => x.BloodType).HasMaxLength(10);
            // New nullable columns — safe for existing rows
            b.Property(x => x.MRN).HasMaxLength(20);
            b.HasIndex(x => x.MRN).IsUnique().HasFilter("[MRN] IS NOT NULL");
            b.Property(x => x.Phone).HasMaxLength(30);
            b.Property(x => x.Address).HasMaxLength(300);
            b.Property(x => x.City).HasMaxLength(100);
            b.Property(x => x.EmergencyContactName).HasMaxLength(150);
            b.Property(x => x.EmergencyContactPhone).HasMaxLength(30);
            b.Property(x => x.EmergencyContactRelation).HasMaxLength(50);
            b.Property(x => x.InsuranceCompany).HasMaxLength(150);
            b.Property(x => x.InsurancePolicyNumber).HasMaxLength(60);
        });

        builder.Entity<Appointment>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Status).HasMaxLength(30);
            b.Property(x => x.Type).HasMaxLength(30).HasDefaultValue("Scheduled");
            b.Property(x => x.ConsultationType).HasMaxLength(20);
            b.Property(x => x.Notes).HasMaxLength(1000);

            b.HasOne(x => x.Doctor)
                .WithMany(d => d.Appointments)
                .HasForeignKey(x => x.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(x => x.Patient)
                .WithMany(p => p.Appointments)
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(x => x.Branch)
                .WithMany()
                .HasForeignKey(x => x.BranchId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasOne(x => x.Invoice)
                .WithMany()
                .HasForeignKey(x => x.InvoiceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Payment>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Amount).HasPrecision(18, 2);
            b.Property(x => x.Currency).HasMaxLength(10);
            b.Property(x => x.Status).HasMaxLength(30);
            b.Property(x => x.PaymentMethod).HasMaxLength(50);
            b.HasOne(x => x.Appointment)
                .WithMany()
                .HasForeignKey(x => x.AppointmentId);
        });

        builder.Entity<RefreshToken>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.Token).IsUnique();
            b.HasOne(x => x.User).WithMany(u => u.RefreshTokens).HasForeignKey(x => x.UserId);
        });

        // AppUser → Branch (optional FK)
        builder.Entity<AppUser>(b =>
        {
            b.HasOne(x => x.Branch)
                .WithMany()
                .HasForeignKey(x => x.BranchId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ── NEW ENTITIES ─────────────────────────────────

        builder.Entity<Branch>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(200).IsRequired();
            b.Property(x => x.Address).HasMaxLength(300);
            b.Property(x => x.City).HasMaxLength(100);
            b.Property(x => x.Phone).HasMaxLength(30);
            b.Property(x => x.Email).HasMaxLength(150);
            b.HasIndex(x => x.Name);
        });

        builder.Entity<QueueEntry>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Status).HasMaxLength(20);
            b.Property(x => x.Priority).HasMaxLength(20);
            b.Property(x => x.Notes).HasMaxLength(500);
            b.HasIndex(x => new { x.BranchId, x.CreatedAtUtc });

            b.HasOne(x => x.Branch)
                .WithMany()
                .HasForeignKey(x => x.BranchId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(x => x.Patient)
                .WithMany()
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(x => x.Appointment)
                .WithMany()
                .HasForeignKey(x => x.AppointmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Prescription>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Status).HasMaxLength(20);
            b.Property(x => x.Notes).HasMaxLength(1000);

            b.HasOne(x => x.Appointment)
                .WithMany()
                .HasForeignKey(x => x.AppointmentId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(x => x.Doctor)
                .WithMany()
                .HasForeignKey(x => x.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(x => x.Patient)
                .WithMany()
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PrescriptionItem>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.MedicationName).HasMaxLength(200);
            b.Property(x => x.Dosage).HasMaxLength(100);
            b.Property(x => x.Frequency).HasMaxLength(100);
            b.Property(x => x.Instructions).HasMaxLength(500);

            b.HasOne(x => x.Prescription)
                .WithMany(p => p.Items)
                .HasForeignKey(x => x.PrescriptionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<LabOrder>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Status).HasMaxLength(30);
            b.Property(x => x.Priority).HasMaxLength(20);
            b.Property(x => x.Notes).HasMaxLength(500);

            b.HasOne(x => x.Appointment)
                .WithMany()
                .HasForeignKey(x => x.AppointmentId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(x => x.Doctor)
                .WithMany()
                .HasForeignKey(x => x.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(x => x.Patient)
                .WithMany()
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<LabOrderTest>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.TestName).HasMaxLength(200);
            b.Property(x => x.TestCode).HasMaxLength(50);
            b.Property(x => x.SpecimenType).HasMaxLength(100);
            b.Property(x => x.Status).HasMaxLength(20);

            b.HasOne(x => x.LabOrder)
                .WithMany(o => o.Tests)
                .HasForeignKey(x => x.LabOrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<LabResult>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Value).HasMaxLength(200);
            b.Property(x => x.Unit).HasMaxLength(50);
            b.Property(x => x.ReferenceRange).HasMaxLength(100);
            b.Property(x => x.Flag).HasMaxLength(20);
            b.Property(x => x.Notes).HasMaxLength(500);

            b.HasOne(x => x.LabOrder)
                .WithMany(o => o.Results)
                .HasForeignKey(x => x.LabOrderId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(x => x.LabOrderTest)
                .WithMany()
                .HasForeignKey(x => x.LabOrderTestId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<ClinicService>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(200).IsRequired();
            b.Property(x => x.Category).HasMaxLength(50);
            b.Property(x => x.Currency).HasMaxLength(10);
            b.Property(x => x.Price).HasPrecision(18, 2);
            b.Property(x => x.Description).HasMaxLength(500);
        });

        builder.Entity<Invoice>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.InvoiceNumber).HasMaxLength(30).IsRequired();
            b.HasIndex(x => x.InvoiceNumber).IsUnique();
            b.Property(x => x.Currency).HasMaxLength(10);
            b.Property(x => x.Status).HasMaxLength(30);
            b.Property(x => x.Notes).HasMaxLength(500);
            b.Property(x => x.Subtotal).HasPrecision(18, 2);
            b.Property(x => x.TaxAmount).HasPrecision(18, 2);
            b.Property(x => x.TotalAmount).HasPrecision(18, 2);

            b.HasOne(x => x.Patient)
                .WithMany(p => p.Invoices)
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(x => x.Appointment)
                .WithMany()
                .HasForeignKey(x => x.AppointmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<InvoiceItem>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Description).HasMaxLength(300);
            b.Property(x => x.UnitPrice).HasPrecision(18, 2);
            b.Property(x => x.LineTotal).HasPrecision(18, 2);

            b.HasOne(x => x.Invoice)
                .WithMany(i => i.Items)
                .HasForeignKey(x => x.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.ClinicService)
                .WithMany()
                .HasForeignKey(x => x.ClinicServiceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<InsuranceClaim>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.InsuranceCompany).HasMaxLength(150);
            b.Property(x => x.PolicyNumber).HasMaxLength(60);
            b.Property(x => x.Status).HasMaxLength(20);
            b.Property(x => x.ReferenceNumber).HasMaxLength(60);
            b.Property(x => x.RejectionReason).HasMaxLength(500);
            b.Property(x => x.ClaimAmount).HasPrecision(18, 2);
            b.Property(x => x.ApprovedAmount).HasPrecision(18, 2);

            b.HasOne(x => x.Invoice)
                .WithMany(i => i.InsuranceClaims)
                .HasForeignKey(x => x.InvoiceId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(x => x.Patient)
                .WithMany()
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<InventoryItem>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(200).IsRequired();
            b.Property(x => x.Category).HasMaxLength(50);
            b.Property(x => x.SKU).HasMaxLength(100);
            b.HasIndex(x => x.SKU).IsUnique().HasFilter("[SKU] IS NOT NULL");
            b.Property(x => x.Unit).HasMaxLength(30);
            b.Property(x => x.UnitCost).HasPrecision(18, 2);
            b.Property(x => x.Description).HasMaxLength(500);

            b.HasOne(x => x.Branch)
                .WithMany()
                .HasForeignKey(x => x.BranchId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<InventoryMovement>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.MovementType).HasMaxLength(20);
            b.Property(x => x.Reason).HasMaxLength(300);
            b.Property(x => x.ReferenceId).HasMaxLength(100);

            b.HasOne(x => x.InventoryItem)
                .WithMany(i => i.Movements)
                .HasForeignKey(x => x.InventoryItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<StaffShift>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.ShiftType).HasMaxLength(30);
            b.Property(x => x.Status).HasMaxLength(20);
            b.Property(x => x.Notes).HasMaxLength(500);
            b.HasIndex(x => new { x.UserId, x.ShiftStartUtc });

            b.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(x => x.Branch)
                .WithMany()
                .HasForeignKey(x => x.BranchId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<LeaveRequest>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.LeaveType).HasMaxLength(30);
            b.Property(x => x.Status).HasMaxLength(20);
            b.Property(x => x.Reason).HasMaxLength(500);
            b.Property(x => x.ReviewerNote).HasMaxLength(500);
            b.HasIndex(x => new { x.UserId, x.StartDate });

            b.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PatientDocument>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.FileName).HasMaxLength(300);
            b.Property(x => x.OriginalFileName).HasMaxLength(300);
            b.Property(x => x.ContentType).HasMaxLength(100);
            b.Property(x => x.StoragePath).HasMaxLength(500);
            b.Property(x => x.DocumentType).HasMaxLength(50);
            b.Property(x => x.Description).HasMaxLength(500);

            b.HasOne(x => x.Patient)
                .WithMany(p => p.Documents)
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
