using System.Diagnostics;
using AyVino.Api.Common.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace AyVino.Api.Common.Middleware;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, title, detail) = exception switch
        {
            AppException appEx => (
                appEx.StatusCode,
                GetTitleForStatusCode(appEx.StatusCode),
                appEx.Message
            ),
            _ => (
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                "Ha ocurrido un error inesperado al procesar la solicitud."
            )
        };

        if (statusCode >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Excepción no controlada en {Path}: {Message}", httpContext.Request.Path, exception.Message);
        }
        else
        {
            logger.LogWarning("Excepción de dominio ({StatusCode}) en {Path}: {Message}", statusCode, httpContext.Request.Path, exception.Message);
        }

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = httpContext.Request.Path,
            Extensions =
            {
                ["traceId"] = Activity.Current?.Id ?? httpContext.TraceIdentifier
            }
        };

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/problem+json";

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken: cancellationToken);

        return true;
    }

    private static string GetTitleForStatusCode(int statusCode) => statusCode switch
    {
        StatusCodes.Status400BadRequest => "Error de validación",
        StatusCodes.Status401Unauthorized => "No autorizado",
        StatusCodes.Status403Forbidden => "Acceso prohibido",
        StatusCodes.Status404NotFound => "Recurso no encontrado",
        StatusCodes.Status409Conflict => "Conflicto de recursos",
        _ => "Error en la solicitud"
    };
}

