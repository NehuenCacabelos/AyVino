using AyVino.Api.Common.Security;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;

namespace AyVino.Api.Features.Wineries.Rules;

public static class WineryAccessRules
{
    // El usuario es el dueño registrado de la bodega (una bodega sin dueño no tiene dueño).
    public static bool IsOwner(Winery? winery, Actor actor)
        => winery?.UserId is int ownerId && ownerId == actor.UserId;

    // Puede editar los datos de la bodega o de sus vinos: Admin o dueño (aunque esté Pending).
    public static bool CanManage(Winery? winery, Actor actor)
        => actor.IsAdmin || IsOwner(winery, actor);

    // Puede publicar/reclamar vinos oficiales a nombre de la bodega: Admin, o dueño con la bodega Approved.
    public static bool CanPublish(Winery? winery, Actor actor)
        => actor.IsAdmin || (IsOwner(winery, actor) && winery!.Status == WineryStatus.Approved);
}

