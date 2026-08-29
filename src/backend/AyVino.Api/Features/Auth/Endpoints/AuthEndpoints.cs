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

        group.MapPost("/login", async (LoginRequestDto request, IAuthService authService, CancellationToken ct) =>
        {
            var response = await authService.LoginAsync(request, ct);
            return Results.Ok(response);
        })
        .WithName("Login")
        .WithSummary("Inicia sesión y genera un token JWT");

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

