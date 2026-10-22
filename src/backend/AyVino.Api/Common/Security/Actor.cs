using AyVino.Api.Common.Constants;

namespace AyVino.Api.Common.Security;

// Quién está ejecutando la acción: id y rol salidos del JWT. Los services lo usan para decidir permisos.
public sealed record Actor(int UserId, string Role)
{
    public bool IsAdmin => string.Equals(Role, AppRoles.Admin, StringComparison.Ordinal);
}

