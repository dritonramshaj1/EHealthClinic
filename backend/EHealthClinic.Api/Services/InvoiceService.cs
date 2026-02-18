using EHealthClinic.Api.Data;
using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Services;

public sealed class InvoiceService : IInvoiceService
{
    private readonly ApplicationDbContext _db;

    public InvoiceService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<InvoiceResponse>> GetAllAsync(Guid? patientId = null, string? status = null)
    {
        var q = _db.Invoices
            .Include(i => i.Patient).ThenInclude(p => p.User)
            .Include(i => i.Items).ThenInclude(ii => ii.ClinicService)
            .AsQueryable();

        if (patientId.HasValue) q = q.Where(i => i.PatientId == patientId.Value);
        if (!string.IsNullOrEmpty(status)) q = q.Where(i => i.Status == status);

        return await q.OrderByDescending(i => i.IssuedAtUtc).Select(i => ToResponse(i)).ToListAsync();
    }

    public async Task<InvoiceResponse?> GetByIdAsync(Guid id)
    {
        var i = await _db.Invoices
            .Include(i => i.Patient).ThenInclude(p => p.User)
            .Include(i => i.Items).ThenInclude(ii => ii.ClinicService)
            .FirstOrDefaultAsync(i => i.Id == id);
        return i is null ? null : ToResponse(i);
    }

    public async Task<InvoiceResponse> CreateAsync(CreateInvoiceRequest request)
    {
        var items = (request.Items ?? new List<CreateInvoiceItemRequest>())
            .Select(it => new InvoiceItem
            {
                Id = Guid.NewGuid(),
                Description = it.Description,
                Quantity = it.Quantity,
                UnitPrice = it.UnitPrice,
                LineTotal = it.Quantity * it.UnitPrice,
                ClinicServiceId = it.ClinicServiceId
            }).ToList();

        var subtotal = items.Sum(it => it.LineTotal);
        var total = subtotal + request.TaxAmount;

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            InvoiceNumber = await GenerateInvoiceNumberAsync(),
            PatientId = request.PatientId,
            AppointmentId = request.AppointmentId,
            Subtotal = subtotal,
            TaxAmount = request.TaxAmount,
            TotalAmount = total,
            Currency = "EUR",
            Status = "Draft",
            Notes = request.Notes,
            IssuedAtUtc = DateTime.UtcNow,
            DueAtUtc = request.DueAtUtc,
            Items = items
        };

        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync();
        return (await GetByIdAsync(invoice.Id))!;
    }

    public async Task<InvoiceResponse?> UpdateStatusAsync(Guid id, string status)
    {
        var invoice = await _db.Invoices.FindAsync(id);
        if (invoice is null) return null;
        invoice.Status = status;
        if (status == "Paid") invoice.PaidAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<InvoiceResponse?> AddItemAsync(Guid invoiceId, CreateInvoiceItemRequest request)
    {
        var invoice = await _db.Invoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == invoiceId);
        if (invoice is null) return null;

        var item = new InvoiceItem
        {
            Id = Guid.NewGuid(),
            InvoiceId = invoiceId,
            Description = request.Description,
            Quantity = request.Quantity,
            UnitPrice = request.UnitPrice,
            LineTotal = request.Quantity * request.UnitPrice,
            ClinicServiceId = request.ClinicServiceId
        };

        invoice.Items.Add(item);
        invoice.Subtotal = invoice.Items.Sum(i => i.LineTotal);
        invoice.TotalAmount = invoice.Subtotal + invoice.TaxAmount;

        await _db.SaveChangesAsync();
        return await GetByIdAsync(invoiceId);
    }

    public async Task<string> GenerateInvoiceNumberAsync()
    {
        var year = DateTime.UtcNow.Year;
        var count = await _db.Invoices.CountAsync(i => i.IssuedAtUtc.Year == year);
        return $"INV-{year}-{(count + 1):D6}";
    }

    private static InvoiceResponse ToResponse(Invoice i) =>
        new(i.Id, i.InvoiceNumber,
            i.PatientId, i.Patient?.User?.FullName ?? "", i.Patient?.MRN,
            i.AppointmentId, i.Subtotal, i.TaxAmount, i.TotalAmount,
            i.Currency, i.Status, i.Notes, i.IssuedAtUtc, i.DueAtUtc, i.PaidAtUtc,
            i.Items.Select(it => new InvoiceItemResponse(it.Id, it.Description, it.Quantity, it.UnitPrice, it.LineTotal, it.ClinicServiceId, it.ClinicService?.Name)).ToList());
}
