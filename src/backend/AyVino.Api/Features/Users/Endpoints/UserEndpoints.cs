using System.Security.Claims;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Audit.Endpoints;
using AyVino.Api.Features.Audit.Enums;
using AyVino.Api.Features.Cellars.Services;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace AyVino.Api.Features.Users.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        // Grupo público (no requiere autenticación)
        var publicGroup = app.MapGroup("/api/users")
                             .WithTags("Users");

        publicGroup.MapPost("/", async (RegisterUserRequestDto request, IUserService userService, CancellationToken ct) =>
        {
            var createdUser = await userService.RegisterAsync(request.ToCreateDto(), ct);
            return Results.Created("/api/users/me", createdUser);
        })
        .AllowAnonymous()
        .WithName("RegisterUser")
        .WithSummary("Registra un nuevo usuario con sus credenciales");

        publicGroup.MapGet("/{username}", async (string username, IUserService userService, CancellationToken ct) =>
        {
            var user = await userService.GetPublicProfileByUsernameAsync(username, ct);
            return Results.Ok(user);
        })
        .AllowAnonymous()
        .WithName("GetPublicUserProfile")
        .WithSummary("Obtiene el perfil público de un usuario por su nombre de usuario");

        publicGroup.MapGet("/{username}/cellar-items", async (string username, ICellarItemService cellarItemService, CancellationToken ct, int pageNumber = 1, int pageSize = 20) =>
        {
            var items = await cellarItemService.GetPublicCellarItemsAsync(username, pageNumber, pageSize, ct);
            return Results.Ok(items);
        })
        .AllowAnonymous()
        .WithName("GetPublicCellarItems")
        .WithSummary("Obtiene los vinos públicos en cava de un usuario por su nombre de usuario");

        // Grupo para usuarios autenticados (requiere login)
        var authenticatedGroup = app.MapGroup("/api/users")
                                    .WithTags("Users profile")
                                    .RequireAuthorization();

        authenticatedGroup.MapGet("/me", async (ClaimsPrincipal claimsPrincipal, IUserService userService, CancellationToken ct) =>
        {
            var userId = claimsPrincipal.GetUserId();
            var user = await userService.GetByIdAsync(userId, ct);
            return Results.Ok(user);
        })
        .WithName("GetCurrentUserProfile")
        .WithSummary("Obtiene el perfil del usuario autenticado actual");

        authenticatedGroup.MapPut("/me", async (UpdateUserProfileRequestDto request, ClaimsPrincipal claimsPrincipal, IUserService userService, CancellationToken ct) =>
        {
            var userId = claimsPrincipal.GetUserId();
            var updatedUser = await userService.UpdateProfileAsync(userId, request, ct);
            return Results.Ok(updatedUser);
        })
        .WithName("UpdateMyProfile")
        .WithSummary("Actualiza el perfil del usuario autenticado actual");

        authenticatedGroup.MapPut("/me/avatar", async (IFormFile file, ClaimsPrincipal claimsPrincipal, IImageOrchestrator imageOrchestrator, CancellationToken ct) =>
        {
            var userId = claimsPrincipal.GetUserId();
            var imageId = await imageOrchestrator.UploadAvatarAsync(userId, file, ct);
            return Results.Ok(new { imageId });
        })
        .DisableAntiforgery()
        .WithName("UploadMyAvatar")
        .WithSummary("Sube una foto de perfil personalizada para el usuario autenticado");


        authenticatedGroup.MapDelete("/me/avatar", async (ClaimsPrincipal claimsPrincipal, IImageOrchestrator imageOrchestrator, CancellationToken ct) =>
        {
            var userId = claimsPrincipal.GetUserId();
            await imageOrchestrator.DeleteAvatarAsync(userId, ct);
            return Results.NoContent();
        })
        .WithName("DeleteMyAvatar")
        .WithSummary("Elimina la foto de perfil personalizada del usuario autenticado");

        // Grupo administrativo (requiere rol Admin)
        var adminGroup = app.MapGroup("/api/users")
                            .WithTags("Admin - Users")
                            .RequireAuthorization(AppPolicies.RequireAdmin);

        adminGroup.MapPut("/{id:int}/profile", async (int id, UpdateUserProfileRequestDto request, IUserService userService, CancellationToken ct) =>
        {
            var updatedUser = await userService.UpdateProfileAsync(id, request, ct);
            return Results.Ok(updatedUser);
        })
        .WithName("AdminUpdateUserProfile")
        .WithSummary("Actualiza el perfil de cualquier usuario");

        adminGroup.MapGet("/", async (IUserService userService, CancellationToken ct, int pageNumber = 1, int pageSize = 10) =>
        {
            var users = await userService.GetAllAsync(pageNumber, pageSize, ct);
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
        .WithSummary("Activa o desactiva la cuenta de un usuario")
        .WithAudit(AuditAction.UserStatusChanged, "User", idRouteKey: "id", details: (ctx, res) => ctx.Arguments.OfType<ChangeUserStatusRequestDto>().FirstOrDefault()?.IsActive == true ? "isActive=true" : "isActive=false");

        adminGroup.MapPatch("/{id:int}/role", async (int id, ChangeUserRoleRequestDto request, ClaimsPrincipal user, IUserService userService, CancellationToken ct) =>
        {
            await userService.ChangeRoleAsync(user.GetUserId(), id, request.Role, ct);
            return Results.NoContent();
        })
        .WithName("ChangeUserRole")
        .WithSummary("Cambia el rol de un usuario (solo Admin y User)")
        .WithAudit(AuditAction.UserRoleChanged, "User", idRouteKey: "id", details: (ctx, res) => ctx.Arguments.OfType<ChangeUserRoleRequestDto>().FirstOrDefault()?.Role);

        adminGroup.MapDelete("/{id:int}", async (int id, IUserService userService, CancellationToken ct) =>
        {
            await userService.DeleteAsync(id, ct);
            return Results.NoContent();
        })
        .WithName("DeleteUser")
        .WithSummary("Elimina un usuario y sus credenciales asociadas")
        .WithAudit(AuditAction.UserDeleted, "User", idRouteKey: "id");

        return app;
    }
}

