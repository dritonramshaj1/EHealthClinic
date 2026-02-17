using EHealthClinic.Api.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace EHealthClinic.Api.Data;

public sealed class ApplicationDbContext : IdentityDbContext<AppUser, Microsoft.AspNetCore.Identity.IdentityRole<Guid>, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<DoctorProfile> Doctors => Set<DoctorProfile>();
    public DbSet<PatientProfile> Patients => Set<PatientProfile>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

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
        });

        builder.Entity<Appointment>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Status).HasMaxLength(30);

            b.HasOne(x => x.Doctor)
                .WithMany(d => d.Appointments)
                .HasForeignKey(x => x.DoctorId)
                .OnDelete(DeleteBehavior.Restrict); // ose NoAction

            b.HasOne(x => x.Patient)
                .WithMany(p => p.Appointments)
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict); // ose NoAction
        });


        builder.Entity<Payment>(b =>
        {
            b.HasKey(x => x.Id);

            b.Property(x => x.Amount)
                .HasPrecision(18, 2);

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
    }
}
