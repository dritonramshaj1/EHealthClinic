using EHealthClinic.Api.Data;
using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace EHealthClinic.Api.Services;

public sealed class DocumentService : IDocumentService
{
    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;

    public DocumentService(ApplicationDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    private string StorageRoot => Path.Combine(_env.ContentRootPath, "Storage", "Documents");

    public async Task<List<PatientDocumentResponse>> GetPatientDocumentsAsync(Guid patientId)
    {
        return await _db.PatientDocuments
            .Include(d => d.Patient).ThenInclude(p => p.User)
            .Where(d => d.PatientId == patientId && !d.IsDeleted)
            .OrderByDescending(d => d.UploadedAtUtc)
            .Select(d => ToResponse(d))
            .ToListAsync();
    }

    public async Task<PatientDocumentResponse> UploadAsync(Guid patientId, Guid uploadedByUserId, IFormFile file, string documentType, string? description)
    {
        Directory.CreateDirectory(StorageRoot);

        var uniqueName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var storagePath = Path.Combine(StorageRoot, uniqueName);

        using (var stream = new FileStream(storagePath, FileMode.Create))
            await file.CopyToAsync(stream);

        var doc = new PatientDocument
        {
            Id = Guid.NewGuid(),
            PatientId = patientId,
            UploadedByUserId = uploadedByUserId,
            FileName = uniqueName,
            OriginalFileName = file.FileName,
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            StoragePath = storagePath,
            DocumentType = documentType,
            Description = description,
            IsDeleted = false,
            UploadedAtUtc = DateTime.UtcNow
        };

        _db.PatientDocuments.Add(doc);
        await _db.SaveChangesAsync();

        return await _db.PatientDocuments
            .Include(d => d.Patient).ThenInclude(p => p.User)
            .Where(d => d.Id == doc.Id)
            .Select(d => ToResponse(d))
            .FirstAsync();
    }

    public async Task<(byte[] content, string contentType, string fileName)?> DownloadAsync(Guid documentId)
    {
        var doc = await _db.PatientDocuments.FindAsync(documentId);
        if (doc is null || doc.IsDeleted) return null;
        if (!File.Exists(doc.StoragePath)) return null;

        var bytes = await File.ReadAllBytesAsync(doc.StoragePath);
        return (bytes, doc.ContentType, doc.OriginalFileName);
    }

    public async Task<bool> DeleteAsync(Guid documentId)
    {
        var doc = await _db.PatientDocuments.FindAsync(documentId);
        if (doc is null) return false;
        doc.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }

    private static PatientDocumentResponse ToResponse(PatientDocument d) =>
        new(d.Id, d.PatientId, d.Patient?.User?.FullName ?? "",
            d.UploadedByUserId, d.OriginalFileName,
            d.ContentType, d.FileSizeBytes,
            d.DocumentType, d.Description, d.IsDeleted, d.UploadedAtUtc);
}
