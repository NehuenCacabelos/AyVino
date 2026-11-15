using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.AdminStats.DTOs;
using AyVino.Api.Features.AdminStats.Repositories;

namespace AyVino.Api.Features.AdminStats.Services;

public class AdminStatsService(IAdminStatsRepository repository) : IAdminStatsService
{
    public async Task<AdminStatsDto> GetStatsAsync(Actor actor, CancellationToken ct = default)
    {
        if (!actor.IsAdmin)
        {
            throw new ForbiddenException("Solo un administrador puede consultar las estadísticas del sistema.");
        }

        return await repository.GetStatsAsync(ct);
    }
}
