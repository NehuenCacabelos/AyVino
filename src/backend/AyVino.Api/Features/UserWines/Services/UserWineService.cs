using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.UserWines.DTOs;
using AyVino.Api.Features.UserWines.Repositories;
using AyVino.Api.Features.Wines.Repositories;

namespace AyVino.Api.Features.UserWines.Services;

public class UserWineService(
    IUserWineRepository userWineRepository,
    IWineRepository wineRepository) : IUserWineService
{
    public async Task MarkWantedAsync(int userId, int wineId, CancellationToken ct = default)
    {
        await EnsureWineExistsAsync(wineId, ct);
        await userWineRepository.MarkAsync(userId, wineId, wanted: true, tried: false, favorite: false, ct);
    }

    public async Task UnmarkWantedAsync(int userId, int wineId, CancellationToken ct = default)
    {
        await EnsureWineExistsAsync(wineId, ct);
        await userWineRepository.UnmarkAsync(userId, wineId, clearWanted: true, clearFavorite: false, ct);
    }

    public async Task MarkTriedAsync(int userId, int wineId, CancellationToken ct = default)
    {
        await EnsureWineExistsAsync(wineId, ct);
        await userWineRepository.MarkAsync(userId, wineId, wanted: false, tried: true, favorite: false, ct);
    }

    public async Task MarkFavoriteAsync(int userId, int wineId, CancellationToken ct = default)
    {
        await EnsureWineExistsAsync(wineId, ct);
        await userWineRepository.MarkAsync(userId, wineId, wanted: false, tried: false, favorite: true, ct);
    }

    public async Task UnmarkFavoriteAsync(int userId, int wineId, CancellationToken ct = default)
    {
        await EnsureWineExistsAsync(wineId, ct);
        await userWineRepository.UnmarkAsync(userId, wineId, clearWanted: false, clearFavorite: true, ct);
    }

    public async Task<UserWineMarksResponseDto> GetMarksAsync(int userId, int wineId, CancellationToken ct = default)
    {
        await EnsureWineExistsAsync(wineId, ct);

        var row = await userWineRepository.GetAsync(userId, wineId, ct);

        // Sin fila = el usuario no marcó nada sobre este vino.
        return row is null
            ? new UserWineMarksResponseDto(wineId, false, false, false)
            : row.ToMarksDto();
    }

    public async Task<IReadOnlyList<UserWineListItemDto>> GetAllByUserAsync(int userId, int pageNumber, int pageSize, bool? wanted, bool? tried, bool? favorite, CancellationToken ct = default)
    {
        ValidatePaging(pageNumber, pageSize);

        var rows = await userWineRepository.GetAllByUserAsync(userId, pageNumber, pageSize, wanted, tried, favorite, ct);
        return rows.ToListItemDtoList();
    }

    private async Task EnsureWineExistsAsync(int wineId, CancellationToken ct)
    {
        var exists = wineId > 0 && await wineRepository.ExistsByIdAsync(wineId, ct);
        if (!exists)
            throw new NotFoundException($"Vino con ID {wineId} no encontrado.");
    }

    private static void ValidatePaging(int pageNumber, int pageSize)
    {
        if (pageNumber <= 0) throw new ValidationException("pageNumber debe ser mayor a 0.");
        if (pageSize is < 1 or > 100) throw new ValidationException("pageSize debe estar entre 1 y 100.");
    }
}