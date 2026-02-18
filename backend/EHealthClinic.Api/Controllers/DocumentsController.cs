using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documents;
    private readonly IAuditService _audit;

    public DocumentsController(IDocumentService documents, IAuditService audit)
    {
        _documents = documents;
        _audit = audit;
    }

    [HttpGet("patient/{patientId:guid}")]
    [Authorize(Policy = "documents.read")]
    public async Task<IActionResult> GetPatientDocuments(Guid patientId)
    {
        var result = await _documents.GetPatientDocumentsAsync(patientId);
        return Ok(result);
    }

    [HttpPost("patient/{patientId:guid}")]
    [Authorize(Policy = "documents.write")]
    public async Task<IActionResult> Upload(
        Guid patientId,
        IFormFile file,
        [FromForm] string documentType,
        [FromForm] string? description)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file uploaded");

        var userId = GetUserId();
        var result = await _documents.UploadAsync(patientId, userId, file, documentType, description);
        await _audit.LogAsync(userId, "Upload", "PatientDocument", result.Id.ToString(), $"Document uploaded for patient {patientId}: {result.OriginalFileName}");
        return Ok(result);
    }

    [HttpGet("{id:guid}/download")]
    [Authorize(Policy = "documents.read")]
    public async Task<IActionResult> Download(Guid id)
    {
        var result = await _documents.DownloadAsync(id);
        if (result is null) return NotFound();

        var (content, contentType, fileName) = result.Value;
        return File(content, contentType, fileName);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "documents.write")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var ok = await _documents.DeleteAsync(id);
        if (!ok) return NotFound();
        await _audit.LogAsync(GetUserId(), "Delete", "PatientDocument", id.ToString(), "Document deleted");
        return NoContent();
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }
}
