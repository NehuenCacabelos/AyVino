using AyVino.Api.Features.UserWines.DTOs;

namespace AyVino.Api.Features.UserWines.Services;

public interface IUserWineService
{
    Task MarkWantedAsync(int userId, int wineId, CancellationToken ct = default);
    Task UnmarkWantedAsync(int userId, int wineId, CancellationToken ct = default);
    Task MarkTriedAsync(int userId, int wineId, CancellationToken ct = default);
    Task MarkFavoriteAsync(int userId, int wineId, CancellationToken ct = default);
    Task UnmarkFavoriteAsync(int userId, int wineId, CancellationToken ct = default);
    Task<UserWineMarksResponseDto> GetMarksAsync(int userId, int wineId, CancellationToken ct = default);
    Task<IReadOnlyList<UserWineListItemDto>> GetAllByUserAsync(int userId, int pageNumber, int pageSize, bool? wanted, bool? tried, bool? favorite, CancellationToken ct = default);
}