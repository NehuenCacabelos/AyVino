using AyVino.Api.Common.Constants;
using AyVino.Api.Features.Audit.Services;

namespace AyVino.Api.Features.Audit.Endpoints;

public static class AuditEndpoints
{
    public static IEndpointRouteBuilder MapAuditEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/audit-log")
            .WithTags("Audit")
            .RequireAuthorization(AppPolicies.RequireAdmin);

        group.MapGet("/", async (
            IAuditService service,
            CancellationToken ct,
            int pageNumber = 1,
            int pageSize = 10,
            string? action = null,
            string? entityType = null,
            int? userId = null,
            DateTime? from = null,
            DateTime? to = null) =>
        {
            var result = await service.GetPagedAsync(pageNumber, pageSize, action, entityType, userId, from, to, ct);
            return Results.Ok(result);
        })
        .WithName("GetAuditLogs")
        .WithSummary("Devuelve el registro de auditoría paginado para administradores.");

        return app;
    }
}
