using System.Text;
using ClosedXML.Excel;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using EHealthClinic.Api.Data;
using EHealthClinic.Api.Helpers;
using EHealthClinic.Api.Models;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using PdfColor  = QuestPDF.Infrastructure.Color;
using PdfDoc    = QuestPDF.Fluent.Document;
using WColor    = DocumentFormat.OpenXml.Wordprocessing.Color;
using WDocument = DocumentFormat.OpenXml.Wordprocessing.Document;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/export")]
[Authorize]
public sealed class ExportController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IMedicalRecordService _records;

    static ExportController() => QuestPDF.Settings.License = LicenseType.Community;

    public ExportController(ApplicationDbContext db, IMedicalRecordService records)
    {
        _db = db;
        _records = records;
    }

    // ─── Appointments ─────────────────────────────────────────────────────────

    [HttpGet("appointments")]
    public async Task<ActionResult> ExportAppointments(
        [FromQuery] string format = "xlsx",
        [FromQuery] DateTime? fromUtc = null,
        [FromQuery] DateTime? toUtc = null,
        [FromQuery] string? status = null)
    {
        var userId = User.GetUserId();
        var roles  = User.Claims
            .Where(c => c.Type.Contains("role", StringComparison.OrdinalIgnoreCase))
            .Select(c => c.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var q = _db.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .AsQueryable();

        if (fromUtc is not null) q = q.Where(a => a.StartsAtUtc >= fromUtc);
        if (toUtc   is not null) q = q.Where(a => a.StartsAtUtc <= toUtc);
        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(a => a.Status.ToLower() == status.Trim().ToLower());

        if (!roles.Contains(Roles.Admin))
        {
            if (roles.Contains(Roles.Doctor))
            {
                var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
                if (doctor is null) return Forbid();
                q = q.Where(a => a.DoctorId == doctor.Id);
            }
            else
            {
                var patient = await _db.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient is null) return Forbid();
                q = q.Where(a => a.PatientId == patient.Id);
            }
        }

        var list = await q.OrderByDescending(a => a.StartsAtUtc)
            .Select(a => new
            {
                Date      = a.StartsAtUtc.ToString("yyyy-MM-dd"),
                StartTime = a.StartsAtUtc.ToString("HH:mm"),
                EndTime   = a.EndsAtUtc.ToString("HH:mm"),
                a.Status,
                Doctor    = a.Doctor.User.FullName,
                Specialty = a.Doctor.Specialty,
                Patient   = a.Patient.User.FullName,
                Reason    = a.Reason ?? ""
            })
            .ToListAsync();

        string[] headers = ["Date", "Start Time", "End Time", "Status", "Doctor", "Specialty", "Patient", "Reason"];
        string[][] rows  = list.Select(a => new[]
            { a.Date, a.StartTime, a.EndTime, a.Status, a.Doctor, a.Specialty, a.Patient, a.Reason })
            .ToArray();

        string date = DateTime.UtcNow.ToString("yyyyMMdd");
        return format.ToLower() switch
        {
            "json" => Ok(list),
            "csv"  => CsvResult(headers, rows, $"appointments_{date}.csv"),
            "pdf"  => PdfResult("Appointments Report", headers, rows, $"appointments_{date}.pdf"),
            "docx" => DocxResult("Appointments Report", headers, rows, $"appointments_{date}.docx"),
            _      => XlsxResult("Appointments Report", headers, rows, $"appointments_{date}.xlsx")
        };
    }

    // ─── Patients ─────────────────────────────────────────────────────────────

    [HttpGet("patients")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult> ExportPatients([FromQuery] string format = "xlsx")
    {
        var list = await _db.Patients
            .Include(p => p.User)
            .OrderBy(p => p.User.FullName)
            .Select(p => new
            {
                Name        = p.User.FullName,
                Email       = p.User.Email ?? "",
                BloodType   = p.BloodType ?? "",
                DateOfBirth = p.DateOfBirth.HasValue ? p.DateOfBirth.Value.ToString("yyyy-MM-dd") : "",
                Allergies   = p.Allergies ?? ""
            })
            .ToListAsync();

        string[] headers = ["Name", "Email", "Blood Type", "Date of Birth", "Allergies"];
        string[][] rows  = list.Select(p => new[]
            { p.Name, p.Email, p.BloodType, p.DateOfBirth, p.Allergies })
            .ToArray();

        string date = DateTime.UtcNow.ToString("yyyyMMdd");
        return format.ToLower() switch
        {
            "json" => Ok(list),
            "csv"  => CsvResult(headers, rows, $"patients_{date}.csv"),
            "pdf"  => PdfResult("Patients List", headers, rows, $"patients_{date}.pdf"),
            "docx" => DocxResult("Patients List", headers, rows, $"patients_{date}.docx"),
            _      => XlsxResult("Patients List", headers, rows, $"patients_{date}.xlsx")
        };
    }

    // ─── Medical Records ──────────────────────────────────────────────────────

    [HttpGet("medical-records/{patientId:guid}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Doctor}")]
    public async Task<ActionResult> ExportMedicalRecord(Guid patientId, [FromQuery] string format = "xlsx")
    {
        var doc = await _records.GetByPatientAsync(patientId);
        if (doc is null) return NotFound(new { error = "Medical record not found." });

        var entries = doc.Entries ?? [];

        string[] headers = ["Date", "Title", "Diagnosis", "Description", "Tags"];
        string[][] rows  = entries.Select(e => new[]
        {
            e.DateUtc.ToString("yyyy-MM-dd"),
            e.Title,
            e.Diagnosis   ?? "",
            e.Description ?? "",
            string.Join("; ", e.Tags ?? [])
        }).ToArray();

        string date = DateTime.UtcNow.ToString("yyyyMMdd");
        return format.ToLower() switch
        {
            "json" => Ok(new { patientId, entries }),
            "csv"  => CsvResult(headers, rows, $"medical_record_{patientId}_{date}.csv"),
            "pdf"  => PdfResult("Medical Record", headers, rows, $"medical_record_{patientId}_{date}.pdf"),
            "docx" => DocxResult("Medical Record", headers, rows, $"medical_record_{patientId}_{date}.docx"),
            _      => XlsxResult("Medical Record", headers, rows, $"medical_record_{patientId}_{date}.xlsx")
        };
    }

    // ─── Project Log ──────────────────────────────────────────────────────────

    [HttpGet("project-log")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult> ProjectLog([FromQuery] string format = "xlsx")
    {
        var totalDoctors      = await _db.Doctors.CountAsync();
        var totalPatients     = await _db.Patients.CountAsync();
        var totalAppointments = await _db.Appointments.CountAsync();
        var scheduled         = await _db.Appointments.CountAsync(a => a.Status == "Scheduled");
        var completed         = await _db.Appointments.CountAsync(a => a.Status == "Completed");
        var cancelled         = await _db.Appointments.CountAsync(a => a.Status == "Cancelled");

        var appts = await _db.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .OrderByDescending(a => a.StartsAtUtc)
            .Select(a => new
            {
                Date      = a.StartsAtUtc.ToString("yyyy-MM-dd"),
                StartTime = a.StartsAtUtc.ToString("HH:mm"),
                a.Status,
                Doctor    = a.Doctor.User.FullName,
                Patient   = a.Patient.User.FullName,
                Reason    = a.Reason ?? ""
            })
            .ToListAsync();

        string title = $"EHealth Clinic — Project Log ({DateTime.UtcNow:yyyy-MM-dd})";
        string date  = DateTime.UtcNow.ToString("yyyyMMdd");

        var summaryRows = new[]
        {
            new[] { "Total Doctors",      totalDoctors.ToString() },
            new[] { "Total Patients",     totalPatients.ToString() },
            new[] { "Total Appointments", totalAppointments.ToString() },
            new[] { "Scheduled",          scheduled.ToString() },
            new[] { "Completed",          completed.ToString() },
            new[] { "Cancelled",          cancelled.ToString() }
        };

        string[] apptHeaders = ["Date", "Start Time", "Status", "Doctor", "Patient", "Reason"];
        string[][] apptRows  = appts.Select(a => new[]
            { a.Date, a.StartTime, a.Status, a.Doctor, a.Patient, a.Reason }).ToArray();

        return format.ToLower() switch
        {
            "pdf"  => ProjectLogPdf(title, summaryRows, apptHeaders, apptRows, $"project_log_{date}.pdf"),
            "docx" => ProjectLogDocx(title, summaryRows, apptHeaders, apptRows, $"project_log_{date}.docx"),
            _      => ProjectLogXlsx(title, summaryRows, apptHeaders, apptRows, $"project_log_{date}.xlsx")
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FORMAT HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    private FileResult CsvResult(string[] headers, string[][] rows, string filename)
    {
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",", headers.Select(CsvEscape)));
        foreach (var row in rows)
            sb.AppendLine(string.Join(",", row.Select(CsvEscape)));
        return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", filename);
    }

    private FileResult XlsxResult(string reportTitle, string[] headers, string[][] rows, string filename)
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Report");

        ws.Cell(1, 1).Value = reportTitle;
        ws.Cell(1, 1).Style.Font.Bold      = true;
        ws.Cell(1, 1).Style.Font.FontSize  = 14;
        ws.Cell(1, 1).Style.Font.FontColor = XLColor.FromHtml("#6366f1");
        ws.Range(1, 1, 1, headers.Length).Merge();

        ws.Cell(2, 1).Value = $"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC";
        ws.Cell(2, 1).Style.Font.FontColor = XLColor.FromHtml("#6b7280");
        ws.Cell(2, 1).Style.Font.FontSize  = 9;
        ws.Range(2, 1, 2, headers.Length).Merge();

        int dataStart = 4;

        for (int c = 0; c < headers.Length; c++)
        {
            var cell = ws.Cell(dataStart, c + 1);
            cell.Value = headers[c];
            cell.Style.Font.Bold     = true;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#6366f1");
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cell.Style.Border.OutsideBorderColor = XLColor.FromHtml("#4f46e5");
        }

        for (int r = 0; r < rows.Length; r++)
        {
            string bg = r % 2 == 0 ? "#ffffff" : "#f1f0ff";
            for (int c = 0; c < rows[r].Length; c++)
            {
                var cell = ws.Cell(dataStart + 1 + r, c + 1);
                cell.Value = rows[r][c];
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml(bg);
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                cell.Style.Border.OutsideBorderColor = XLColor.FromHtml("#e5e7eb");
            }
        }

        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return File(ms.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
    }

    private FileResult PdfResult(string title, string[] headers, string[][] rows, string filename)
    {
        int colCount = headers.Length;

        var doc = PdfDoc.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(9));

                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(inner =>
                        {
                            inner.Item().Text(title).FontSize(18).Bold()
                                .FontColor(PdfColor.FromHex("6366f1"));
                            inner.Item().Text($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC")
                                .FontSize(8).FontColor(PdfColor.FromHex("9ca3af"));
                        });
                        row.ConstantItem(80).AlignRight().AlignBottom()
                            .Text($"Total: {rows.Length} records").FontSize(8)
                            .FontColor(PdfColor.FromHex("6b7280"));
                    });
                    col.Item().PaddingTop(6).LineHorizontal(2)
                        .LineColor(PdfColor.FromHex("6366f1"));
                });

                page.Content().PaddingTop(12).Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        for (int i = 0; i < colCount; i++)
                            cols.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        foreach (var h in headers)
                        {
                            header.Cell()
                                .Background(PdfColor.FromHex("6366f1"))
                                .Padding(6)
                                .Text(h)
                                .FontColor(Colors.White).Bold().FontSize(9);
                        }
                    });

                    for (int r = 0; r < rows.Length; r++)
                    {
                        var bg = r % 2 == 0 ? Colors.White : PdfColor.FromHex("f1f0ff");
                        foreach (var cell in rows[r])
                        {
                            table.Cell()
                                .Background(bg)
                                .BorderBottom(0.5f, Unit.Point)
                                .BorderColor(PdfColor.FromHex("e5e7eb"))
                                .PaddingVertical(5).PaddingHorizontal(4)
                                .Text(cell).FontSize(8);
                        }
                    }
                });

                page.Footer().Row(row =>
                {
                    row.RelativeItem().Text("EHealth Clinic — Confidential")
                        .FontSize(7).FontColor(PdfColor.FromHex("9ca3af"));
                    row.RelativeItem().AlignRight().Text(t =>
                    {
                        t.Span("Page ").FontSize(7).FontColor(PdfColor.FromHex("9ca3af"));
                        t.CurrentPageNumber().FontSize(7).FontColor(PdfColor.FromHex("9ca3af"));
                        t.Span(" / ").FontSize(7).FontColor(PdfColor.FromHex("9ca3af"));
                        t.TotalPages().FontSize(7).FontColor(PdfColor.FromHex("9ca3af"));
                    });
                });
            });
        });

        using var ms = new MemoryStream();
        doc.GeneratePdf(ms);
        return File(ms.ToArray(), "application/pdf", filename);
    }

    private FileResult DocxResult(string title, string[] headers, string[][] rows, string filename)
    {
        using var ms = new MemoryStream();
        using (var wordDoc = WordprocessingDocument.Create(ms, WordprocessingDocumentType.Document, true))
        {
            var mainPart = wordDoc.AddMainDocumentPart();
            mainPart.Document = new WDocument();
            var body = mainPart.Document.AppendChild(new Body());

            AppendDocxTitle(body, title);
            AppendDocxSubtitle(body, $"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC  |  Total: {rows.Length} records");
            AppendDocxParagraph(body, "");
            AppendDocxTable(body, headers, rows);
            AppendDocxParagraph(body, "");
            AppendDocxSubtitle(body, "EHealth Clinic — Confidential");

            mainPart.Document.Save();
        }

        return File(ms.ToArray(),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", filename);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PROJECT LOG
    // ═══════════════════════════════════════════════════════════════════════════

    private FileResult ProjectLogXlsx(string title, string[][] summary, string[] apptHeaders, string[][] apptRows, string filename)
    {
        using var wb = new XLWorkbook();

        var ws1 = wb.Worksheets.Add("Summary");
        ws1.Cell(1, 1).Value = title;
        ws1.Cell(1, 1).Style.Font.Bold      = true;
        ws1.Cell(1, 1).Style.Font.FontSize  = 16;
        ws1.Cell(1, 1).Style.Font.FontColor = XLColor.FromHtml("#6366f1");
        ws1.Range(1, 1, 1, 2).Merge();

        ws1.Cell(2, 1).Value = $"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC";
        ws1.Cell(2, 1).Style.Font.FontColor = XLColor.FromHtml("#9ca3af");
        ws1.Cell(2, 1).Style.Font.FontSize  = 9;
        ws1.Range(2, 1, 2, 2).Merge();

        ws1.Cell(4, 1).Value = "Metric";
        ws1.Cell(4, 2).Value = "Value";
        foreach (var hCell in new[] { ws1.Cell(4, 1), ws1.Cell(4, 2) })
        {
            hCell.Style.Font.Bold = true;
            hCell.Style.Font.FontColor = XLColor.White;
            hCell.Style.Fill.BackgroundColor = XLColor.FromHtml("#6366f1");
            hCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            hCell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        }

        for (int r = 0; r < summary.Length; r++)
        {
            var bg = r % 2 == 0 ? "#ede9fe" : "#f5f3ff";
            var c1 = ws1.Cell(5 + r, 1);
            var c2 = ws1.Cell(5 + r, 2);
            c1.Value = summary[r][0];
            c2.Value = summary[r][1];
            c1.Style.Font.Bold = true;
            c1.Style.Fill.BackgroundColor = XLColor.FromHtml(bg);
            c2.Style.Fill.BackgroundColor = XLColor.FromHtml(bg);
            c2.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            c1.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            c1.Style.Border.OutsideBorderColor = XLColor.FromHtml("#c4b5fd");
            c2.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            c2.Style.Border.OutsideBorderColor = XLColor.FromHtml("#c4b5fd");
        }
        ws1.Columns().AdjustToContents();

        BuildXlsxDataSheet(wb, "Appointments", apptHeaders, apptRows);

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return File(ms.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
    }

    private static void BuildXlsxDataSheet(XLWorkbook wb, string sheetName, string[] headers, string[][] rows)
    {
        var ws = wb.Worksheets.Add(sheetName);

        for (int c = 0; c < headers.Length; c++)
        {
            var cell = ws.Cell(1, c + 1);
            cell.Value = headers[c];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#6366f1");
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cell.Style.Border.OutsideBorderColor = XLColor.FromHtml("#4f46e5");
        }

        for (int r = 0; r < rows.Length; r++)
        {
            string bg = r % 2 == 0 ? "#ffffff" : "#f1f0ff";
            for (int c = 0; c < rows[r].Length; c++)
            {
                var cell = ws.Cell(r + 2, c + 1);
                cell.Value = rows[r][c];
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml(bg);
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                cell.Style.Border.OutsideBorderColor = XLColor.FromHtml("#e5e7eb");
            }
        }

        ws.Columns().AdjustToContents();
    }

    private FileResult ProjectLogPdf(string title, string[][] summary, string[] apptHeaders, string[][] apptRows, string filename)
    {
        var doc = PdfDoc.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Text(title).FontSize(20).Bold().FontColor(PdfColor.FromHex("6366f1"));
                    col.Item().Text($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC")
                        .FontSize(8).FontColor(PdfColor.FromHex("9ca3af"));
                    col.Item().PaddingTop(6).LineHorizontal(2).LineColor(PdfColor.FromHex("6366f1"));
                });

                page.Content().Column(col =>
                {
                    col.Item().PaddingTop(16).Text("System Summary").FontSize(14).Bold()
                        .FontColor(PdfColor.FromHex("374151"));
                    col.Item().PaddingTop(8).Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(3);
                            cols.RelativeColumn(1);
                        });
                        foreach (var row in summary)
                        {
                            table.Cell().Background(PdfColor.FromHex("ede9fe"))
                                .Padding(6).Text(row[0]).Bold().FontSize(9);
                            table.Cell().Background(PdfColor.FromHex("ede9fe"))
                                .Padding(6).AlignRight().Text(row[1]).FontSize(9);
                        }
                    });

                    col.Item().PaddingTop(24).Text("Appointments").FontSize(14).Bold()
                        .FontColor(PdfColor.FromHex("374151"));
                    col.Item().Text($"Total: {apptRows.Length} records").FontSize(8)
                        .FontColor(PdfColor.FromHex("9ca3af"));

                    col.Item().PaddingTop(8).Table(table =>
                    {
                        int colCount = apptHeaders.Length;
                        table.ColumnsDefinition(cols =>
                        {
                            for (int i = 0; i < colCount; i++)
                                cols.RelativeColumn();
                        });

                        table.Header(header =>
                        {
                            foreach (var h in apptHeaders)
                                header.Cell().Background(PdfColor.FromHex("6366f1"))
                                    .Padding(6).Text(h).FontColor(Colors.White).Bold().FontSize(8);
                        });

                        for (int r = 0; r < apptRows.Length; r++)
                        {
                            var bg = r % 2 == 0 ? Colors.White : PdfColor.FromHex("f1f0ff");
                            foreach (var cell in apptRows[r])
                                table.Cell().Background(bg)
                                    .BorderBottom(0.5f, Unit.Point)
                                    .BorderColor(PdfColor.FromHex("e5e7eb"))
                                    .PaddingVertical(5).PaddingHorizontal(4)
                                    .Text(cell).FontSize(8);
                        }
                    });
                });

                page.Footer().Row(row =>
                {
                    row.RelativeItem().Text("EHealth Clinic — Confidential")
                        .FontSize(7).FontColor(PdfColor.FromHex("9ca3af"));
                    row.RelativeItem().AlignRight().Text(t =>
                    {
                        t.Span("Page ").FontSize(7).FontColor(PdfColor.FromHex("9ca3af"));
                        t.CurrentPageNumber().FontSize(7).FontColor(PdfColor.FromHex("9ca3af"));
                        t.Span(" / ").FontSize(7).FontColor(PdfColor.FromHex("9ca3af"));
                        t.TotalPages().FontSize(7).FontColor(PdfColor.FromHex("9ca3af"));
                    });
                });
            });
        });

        using var ms = new MemoryStream();
        doc.GeneratePdf(ms);
        return File(ms.ToArray(), "application/pdf", filename);
    }

    private FileResult ProjectLogDocx(string title, string[][] summary, string[] apptHeaders, string[][] apptRows, string filename)
    {
        using var ms = new MemoryStream();
        using (var wordDoc = WordprocessingDocument.Create(ms, WordprocessingDocumentType.Document, true))
        {
            var mainPart = wordDoc.AddMainDocumentPart();
            mainPart.Document = new WDocument();
            var body = mainPart.Document.AppendChild(new Body());

            AppendDocxTitle(body, title);
            AppendDocxSubtitle(body, $"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC");
            AppendDocxParagraph(body, "");

            AppendDocxHeading(body, "System Summary");
            AppendDocxTable(body, ["Metric", "Value"], summary);
            AppendDocxParagraph(body, "");

            AppendDocxHeading(body, "Appointments");
            AppendDocxSubtitle(body, $"Total: {apptRows.Length} records");
            AppendDocxTable(body, apptHeaders, apptRows);
            AppendDocxParagraph(body, "");
            AppendDocxSubtitle(body, "EHealth Clinic — Confidential");

            mainPart.Document.Save();
        }

        return File(ms.ToArray(),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", filename);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DOCX HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    private static void AppendDocxTitle(Body body, string text)
        => body.AppendChild(new Paragraph(new Run(
            new RunProperties(new Bold(), new FontSize { Val = "40" }, new WColor { Val = "6366f1" }),
            new Text(text))));

    private static void AppendDocxSubtitle(Body body, string text)
        => body.AppendChild(new Paragraph(new Run(
            new RunProperties(new FontSize { Val = "18" }, new WColor { Val = "9ca3af" }),
            new Text(text))));

    private static void AppendDocxHeading(Body body, string text)
        => body.AppendChild(new Paragraph(new Run(
            new RunProperties(new Bold(), new FontSize { Val = "28" }, new WColor { Val = "374151" }),
            new Text(text))));

    private static void AppendDocxParagraph(Body body, string text)
        => body.AppendChild(new Paragraph(new Run(
            new RunProperties(new FontSize { Val = "18" }),
            new Text(text))));

    private static void AppendDocxTable(Body body, string[] headers, string[][] rows)
    {
        var table = new Table();
        table.AppendChild(new TableProperties(
            new TableBorders(
                new TopBorder              { Val = BorderValues.Single, Size = 4 },
                new BottomBorder           { Val = BorderValues.Single, Size = 4 },
                new LeftBorder             { Val = BorderValues.Single, Size = 4 },
                new RightBorder            { Val = BorderValues.Single, Size = 4 },
                new InsideHorizontalBorder { Val = BorderValues.Single, Size = 4 },
                new InsideVerticalBorder   { Val = BorderValues.Single, Size = 4 }
            ),
            new TableWidth { Width = "5000", Type = TableWidthUnitValues.Pct }
        ));

        var headerRow = new TableRow();
        foreach (var h in headers)
            headerRow.AppendChild(new TableCell(
                new TableCellProperties(new Shading { Fill = "6366f1", Val = ShadingPatternValues.Clear }),
                new Paragraph(new Run(
                    new RunProperties(new Bold(), new WColor { Val = "FFFFFF" }, new FontSize { Val = "18" }),
                    new Text(h)))));
        table.AppendChild(headerRow);

        for (int r = 0; r < rows.Length; r++)
        {
            var fill = r % 2 == 0 ? "FFFFFF" : "f1f0ff";
            var row  = new TableRow();
            foreach (var cell in rows[r])
                row.AppendChild(new TableCell(
                    new TableCellProperties(new Shading { Fill = fill, Val = ShadingPatternValues.Clear }),
                    new Paragraph(new Run(
                        new RunProperties(new FontSize { Val = "18" }),
                        new Text(cell)))));
            table.AppendChild(row);
        }

        body.AppendChild(table);
    }

    private static string CsvEscape(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }
}
