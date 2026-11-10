using AyVino.Api.Features.AdminStats.DTOs;

namespace AyVino.Api.Features.AdminStats.Repositories;

public interface IAdminStatsRepository
{
    Task<AdminStatsDto> GetStatsAsync(CancellationToken ct = default);
}
