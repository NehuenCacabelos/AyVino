using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AyVino.Api.Features.Audit.Enums;
using AyVino.Api.Features.Audit.Services;

namespace AyVino.Api.Features.Audit.Endpoints;

public static class AuditEndpointExtensions
{
    public static RouteHandlerBuilder WithAudit(
        this RouteHandlerBuilder builder,
        AuditAction action,
        string entityType,
        string? idRouteKey = "id",
        Func<EndpointFilterInvocationContext, object?, string?>? details = null,
        Func<EndpointFilterInvocationContext, object?, int?>? entityIdResolver = null,
        bool adminOnly = false)
    {
        return builder.AddEndpointFilter(async (context, next) =>
        {
            var result = await next(context);

            bool isSuccess = true;
            if (result is IStatusCodeHttpResult statusCodeResult && statusCodeResult.StatusCode.HasValue)
            {
                isSuccess = statusCodeResult.StatusCode.Value is >= 200 and < 300;
            }

            if (!isSuccess)
            {
                return result;
            }

            try
            {
                var httpContext = context.HttpContext;
                var actor = httpContext.User.GetActorOrNull();

                if (adminOnly && actor?.IsAdmin != true)
                {
                    return result;
                }

                int? entityId = null;
                if (entityIdResolver != null)
                {
                    entityId = entityIdResolver(context, result);
                }
                else if (!string.IsNullOrEmpty(idRouteKey) && httpContext.Request.RouteValues.TryGetValue(idRouteKey, out var rawId) && rawId != null)
                {
                    if (int.TryParse(rawId.ToString(), out var parsedId))
                    {
                        entityId = parsedId;
                    }
                }

                var userId = actor?.UserId;
                var username = httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Name)
                    ?? httpContext.User.FindFirstValue(ClaimTypes.Name)
                    ?? (userId.HasValue ? $"User#{userId.Value}" : "Sistema");

                string? detailsText = details?.Invoke(context, result);

                var auditService = httpContext.RequestServices.GetRequiredService<IAuditService>();
                await auditService.RecordAsync(userId, username, action, entityType, entityId, detailsText, httpContext.RequestAborted);
            }
            catch (Exception ex)
            {
                var logger = context.HttpContext.RequestServices.GetService<ILogger<AuditService>>();
                logger?.LogError(ex, "Error en filter de auditoría para {Action}", action);
            }

            return result;
        });
    }
}
