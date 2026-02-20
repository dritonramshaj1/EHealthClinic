using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace EHealthClinic.Api.Swagger;

/// <summary>
/// Fixes Swagger document generation for Export/Import controllers that return
/// mixed response types (File, JSON) or form data, avoiding 500 when generating swagger.json.
/// </summary>
public sealed class ExportImportOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var controllerName = (context.ApiDescription.ActionDescriptor as ControllerActionDescriptor)?.ControllerName ?? "";
        var isExport = controllerName.Equals("Export", StringComparison.OrdinalIgnoreCase);
        var isImport = controllerName.Equals("Import", StringComparison.OrdinalIgnoreCase);

        if (!isExport && !isImport) return;

        if (isExport)
        {
            // Export endpoints return either file (CSV/XLSX/PDF/DOCX) or JSON; document as generic file response
            operation.Responses["200"] = new OpenApiResponse
            {
                Description = "File download (CSV, Excel, PDF, or DOCX per format param) or JSON when format=json",
                Content = new Dictionary<string, OpenApiMediaType>
                {
                    ["application/octet-stream"] = new OpenApiMediaType
                    {
                        Schema = new OpenApiSchema { Type = "string", Format = "binary" }
                    },
                    ["application/json"] = new OpenApiMediaType
                    {
                        Schema = new OpenApiSchema { Type = "object", Description = "JSON array of records when format=json" }
                    }
                }
            };
        }

        if (isImport)
        {
            // Import expects multipart/form-data; ensure it's documented without breaking schema
            if (operation.RequestBody?.Content.TryGetValue("multipart/form-data", out var mt) == true)
            {
                // Keep as-is but ensure schema exists
                mt.Schema ??= new OpenApiSchema { Type = "object" };
            }
        }
    }
}
