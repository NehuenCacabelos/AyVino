using AyVino.Api.Features.Auth.DTOs;
using AyVino.Api.Features.Auth.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;

namespace AyVino.Api.Features.Auth.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth")
                       .WithTags("Auth");

        group.MapPost("/login", async (LoginRequestDto request, HttpContext context, IAuthService authService, CancellationToken ct) =>
        {
            var ipAddress = context.Connection.RemoteIpAddress?.ToString();
            var response = await authService.LoginAsync(request, ipAddress, ct);
            return Results.Ok(response);
        })
        .RequireRateLimiting("AuthLimit")
        .WithName("Login")
        .WithSummary("Inicia sesión y genera tokens de acceso y refresco");

        group.MapPost("/refresh", async (RefreshRequestDto request, HttpContext context, IAuthService authService, CancellationToken ct) =>
        {
            var ipAddress = context.Connection.RemoteIpAddress?.ToString();
            var response = await authService.RefreshAsync(request, ipAddress, ct);
            return Results.Ok(response);
        })
        .RequireRateLimiting("AuthLimit")
        .WithName("Refresh")
        .WithSummary("Refresca el token de acceso utilizando un token de refresco válido");

        group.MapPost("/revoke", async (RevokeTokenRequestDto request, HttpContext context, IAuthService authService, CancellationToken ct) =>
        {
            var ipAddress = context.Connection.RemoteIpAddress?.ToString();
            await authService.RevokeAsync(request, ipAddress, ct);
            return Results.NoContent();
        })
        .WithName("Revoke")
        .WithSummary("Revoca manualmente un token de refresco (logout)");

        group.MapPost("/change-password", async (ChangePasswordRequestDto request, ClaimsPrincipal claimsPrincipal, IAuthService authService, CancellationToken ct) =>
        {
            var userId = claimsPrincipal.GetUserId();
            await authService.ChangePasswordAsync(userId, request, ct);
            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("ChangePassword")
        .WithSummary("Cambia la contraseña del usuario autenticado");

        return app;
    }
}

