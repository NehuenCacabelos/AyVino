using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using AyVino.Api.Common.Constants;

namespace AyVino.Api.Features.Users.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        // Grupo público (no requiere autenticación)
        var publicGroup = app.MapGroup("/api/users")
                             .WithTags("Users");

        publicGroup.MapPost("/", async (CreateUserRequestDto request, IUserService userService, CancellationToken ct) =>
        {
            var createdUser = await userService.RegisterAsync(request, ct);
            return Results.Created($"/api/users/{createdUser.Id}", createdUser);
        })
        .WithName("RegisterUser")
        .WithSummary("Registra un nuevo usuario con sus credenciales");

        // Grupo para usuarios autenticados (requiere login)
        var authenticatedGroup = app.MapGroup("/api/users")
                                    .WithTags("Users")
                                    .RequireAuthorization();

        authenticatedGroup.MapGet("/me", async (ClaimsPrincipal claimsPrincipal, IUserService userService, CancellationToken ct) =>
        {
            var userIdClaim = claimsPrincipal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? claimsPrincipal.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedException("Token de autenticación inválido o identificador no encontrado.");
            }

            var user = await userService.GetByIdAsync(userId, ct);
            return Results.Ok(user);
        })
        .WithName("GetCurrentUserProfile")
        .WithSummary("Obtiene el perfil del usuario autenticado actual a partir de los Claims del token");

        authenticatedGroup.MapPut("/{id:int}/profile", async (int id, UpdateUserProfileRequestDto request, ClaimsPrincipal claimsPrincipal, IUserService userService, CancellationToken ct) =>
        {
            var userIdClaim = claimsPrincipal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? claimsPrincipal.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var currentUserId))
            {
                throw new UnauthorizedException("Token de autenticación inválido o identificador no encontrado.");
            }

            var isAdmin = claimsPrincipal.IsInRole(AppRoles.Admin);

            if (currentUserId != id && !isAdmin)
            {
                return Results.Problem("No tienes permisos para modificar este perfil.", statusCode: StatusCodes.Status403Forbidden);
            }

            var updatedUser = await userService.UpdateProfileAsync(id, request, ct);
            return Results.Ok(updatedUser);
        })
        .WithName("UpdateUserProfile")
        .WithSummary("Actualiza la información de perfil de un usuario");

        // Grupo administrativo (requiere rol Admin)
        var adminGroup = app.MapGroup("/api/users")
                            .WithTags("Admin - Users")
                            .RequireAuthorization(AppPolicies.RequireAdmin);

        adminGroup.MapGet("/", async (IUserService userService, CancellationToken ct) =>
        {
            var users = await userService.GetAllAsync(ct);
            return Results.Ok(users);
        })
        .WithName("GetAllUsers")
        .WithSummary("Obtiene la lista de todos los usuarios");

        adminGroup.MapGet("/{id:int}", async (int id, IUserService userService, CancellationToken ct) =>
        {
            var user = await userService.GetByIdAsync(id, ct);
            return Results.Ok(user);
        })
        .WithName("GetUserById")
        .WithSummary("Obtiene un usuario por su ID");

        adminGroup.MapPatch("/{id:int}/status", async (int id, ChangeUserStatusRequestDto request, IUserService userService, CancellationToken ct) =>
        {
            await userService.ChangeStatusAsync(id, request.IsActive, ct);
            return Results.NoContent();
        })
        .WithName("ChangeUserStatus")
        .WithSummary("Activa o desactiva la cuenta de un usuario");

        adminGroup.MapDelete("/{id:int}", async (int id, IUserService userService, CancellationToken ct) =>
        {
            await userService.DeleteAsync(id, ct);
            return Results.NoContent();
        })
        .WithName("DeleteUser")
        .WithSummary("Elimina un usuario y sus credenciales asociadas");

        return app;
    }
}

