using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;

namespace System.Security.Claims;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal principal)
    {
        if (principal == null)
        {
            throw new ArgumentNullException(nameof(principal));
        }

        var userIdClaim = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedException("Token de autenticación inválido o identificador no encontrado.");
        }

        return userId;
    }

    public static Actor GetActor(this ClaimsPrincipal principal)
    {
        var role = principal.FindFirstValue(ClaimTypes.Role) ?? AppRoles.User;
        return new Actor(principal.GetUserId(), role);
    }
}

