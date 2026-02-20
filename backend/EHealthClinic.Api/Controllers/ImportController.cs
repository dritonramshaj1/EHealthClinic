using System.Globalization;
using System.Text;
using ClosedXML.Excel;
using EHealthClinic.Api.Data;
using EHealthClinic.Api.Entities;
using EHealthClinic.Api.Helpers;
using EHealthClinic.Api.Models;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/import")]
[Authorize(Roles = Roles.Admin)]
public sealed class ImportController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly ApplicationDbContext _db;
    private readonly IActivityLogService _logs;

    public ImportController(UserManager<AppUser> userManager, ApplicationDbContext db, IActivityLogService logs)
    {
        _userManager = userManager;
        _db = db;
        _logs = logs;
    }

    /// <summary>
    /// Download an Excel template for patient import. Fill the sheet and upload via POST /api/import/patients.
    /// </summary>
    [HttpGet("patients/template")]
    public ActionResult DownloadPatientImportTemplate()
    {
        var headers = new[] { "FullName", "Email", "BloodType", "DateOfBirth", "Allergies", "Phone" };
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Patients");

        for (int c = 0; c < headers.Length; c++)
        {
            var cell = ws.Cell(1, c + 1);
            cell.Value = headers[c];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#6366f1");
            cell.Style.Font.FontColor = XLColor.White;
        }

        ws.Cell(2, 1).Value = "Shembull";
        ws.Cell(2, 2).Value = "pacient@email.com";
        ws.Cell(2, 3).Value = "A+";
        ws.Cell(2, 4).Value = "1990-01-15";
        ws.Range(2, 1, 2, 6).Style.Font.Italic = true;
        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        var filename = $"Patient_Import_Template_{DateTime.UtcNow:yyyyMMdd}.xlsx";
        return File(ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
    }

    /// <summary>
    /// Import patients from a CSV or Excel (.xlsx) file.
    /// Columns: FullName, Email, BloodType, DateOfBirth, Allergies, Phone (optional). First row = header.
    /// </summary>
    [HttpPost("patients")]
    public async Task<ActionResult> ImportPatients(
        IFormFile file,
        [FromForm] string defaultPassword)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded." });

        if (string.IsNullOrWhiteSpace(defaultPassword) || defaultPassword.Length < 8)
            return BadRequest(new { error = "Fjalëkalimi fillestar duhet të jetë të paktën 8 karaktere, me shkronjë të vogël dhe të paktën një shifër." });

        List<string> header;
        List<List<string>> dataRows;
        var isExcel = file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase);

        if (isExcel)
        {
            using var stream = file.OpenReadStream();
            using var wb = new XLWorkbook(stream);
            var ws = wb.Worksheets.First();
            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 0;
            var lastCol = Math.Max(1, ws.LastColumnUsed()?.ColumnNumber() ?? 1);
            if (lastRow < 2)
                return BadRequest(new { error = "Excel must have a header row and at least one data row." });

            header = new List<string>();
            for (int col = 1; col <= lastCol; col++)
                header.Add(ws.Cell(1, col).GetString().Trim());

            dataRows = new List<List<string>>();
            for (int r = 2; r <= lastRow; r++)
            {
                var row = new List<string>();
                for (int col = 1; col <= lastCol; col++)
                    row.Add(ws.Cell(r, col).GetString().Trim());
                dataRows.Add(row);
            }
        }
        else
        {
            using var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8);
            var lines = new List<string>();
            while (await reader.ReadLineAsync() is { } line)
                lines.Add(line);

            if (lines.Count < 2)
                return BadRequest(new { error = "CSV must have a header row and at least one data row." });

            header = ParseCsvLine(lines[0]);
            dataRows = new List<List<string>>();
            for (int i = 1; i < lines.Count; i++)
                dataRows.Add(ParseCsvLine(lines[i]));
        }

        var nameIdx = FindColumnIndex(header, "FullName", "Name");
        var emailIdx = FindColumnIndex(header, "Email");
        var bloodIdx = FindColumnIndex(header, "BloodType", "Blood Type");
        var dobIdx = FindColumnIndex(header, "DateOfBirth", "Date of Birth", "DOB");
        var allergiesIdx = FindColumnIndex(header, "Allergies");
        var phoneIdx = FindColumnIndex(header, "Phone");

        if (nameIdx < 0 || emailIdx < 0)
            return BadRequest(new { error = "File must contain at least 'FullName' (or 'Name') and 'Email' columns." });

        int created = 0;
        var errors = new List<string>();

        for (int i = 0; i < dataRows.Count; i++)
        {
            var cells = dataRows[i];
            var rowNum = i + 2;

            var fullName = GetCell(cells, nameIdx).Trim();
            var email = GetCell(cells, emailIdx).Trim();

            if (string.IsNullOrWhiteSpace(email))
            {
                errors.Add($"Row {rowNum}: Email is required.");
                continue;
            }

            if (string.IsNullOrWhiteSpace(fullName))
                fullName = email;

            var existingUser = await _userManager.FindByEmailAsync(email);
            if (existingUser != null)
            {
                errors.Add($"Row {rowNum}: Email '{email}' already exists.");
                continue;
            }

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = email,
                NormalizedUserName = email.ToUpperInvariant(),
                Email = email,
                NormalizedEmail = email.ToUpperInvariant(),
                FullName = fullName,
                EmailConfirmed = false
            };

            var createResult = await _userManager.CreateAsync(user, defaultPassword);
            if (!createResult.Succeeded)
            {
                var firstError = createResult.Errors.FirstOrDefault()?.Description ?? "Invalid password or user data.";
                errors.Add($"Row {rowNum} ({email}): {firstError}");
                continue;
            }

            await _userManager.AddToRoleAsync(user, Roles.Patient);

            var bloodType = GetCell(cells, bloodIdx).Trim();
            var dobStr = GetCell(cells, dobIdx).Trim();
            var allergies = GetCell(cells, allergiesIdx).Trim();
            var phone = GetCell(cells, phoneIdx).Trim();

            DateOnly? dateOfBirth = null;
            if (!string.IsNullOrWhiteSpace(dobStr) && DateOnly.TryParse(dobStr, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dob))
                dateOfBirth = dob;

            _db.Patients.Add(new PatientProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                BloodType = bloodType.Length > 0 ? bloodType : "",
                Allergies = string.IsNullOrWhiteSpace(allergies) ? null : allergies,
                DateOfBirth = dateOfBirth,
                Phone = string.IsNullOrWhiteSpace(phone) ? null : phone
            });

            created++;
        }

        if (created > 0)
            await _db.SaveChangesAsync();

        await _logs.LogAsync(User.GetUserId(), "ImportPatients",
            $"Created={created};Errors={errors.Count};File={file.FileName}");

        return Ok(new
        {
            created,
            errors,
            message = $"Imported {created} patient(s)." + (errors.Count > 0 ? $" {errors.Count} row(s) had errors." : "")
        });
    }

    private static List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        var current = new StringBuilder();
        var inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString().Trim());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }

        result.Add(current.ToString().Trim());
        return result;
    }

    private static int FindColumnIndex(List<string> headers, params string[] names)
    {
        for (int i = 0; i < headers.Count; i++)
        {
            var h = headers[i].Trim();
            if (names.Any(n => string.Equals(h, n, StringComparison.OrdinalIgnoreCase)))
                return i;
        }
        return -1;
    }

    private static string GetCell(List<string> cells, int index)
    {
        if (index < 0 || index >= cells.Count) return "";
        return cells[index] ?? "";
    }
}
