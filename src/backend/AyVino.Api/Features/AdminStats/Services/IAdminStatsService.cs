using AyVino.Api.Common.Security;
using AyVino.Api.Features.AdminStats.DTOs;

namespace AyVino.Api.Features.AdminStats.Services;

public interface IAdminStatsService
{
    Task<AdminStatsDto> GetStatsAsync(Actor actor, CancellationToken ct = default);
}
