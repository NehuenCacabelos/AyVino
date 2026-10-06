using AyVino.Api.Features.Wines.Models;

namespace AyVino.Api.Features.Wines.Repositories;

public interface IWineVintageRepository
{
    Task<WineVintage?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<WineVintage>> GetAllByWineIdAsync(int wineId, CancellationToken ct = default);
    Task<IEnumerable<WineGrape>> GetGrapesByVintageIdAsync(int vintageId, CancellationToken ct = default);
    Task<IEnumerable<WineGrape>> GetGrapesByVintageIdsAsync(IEnumerable<int> vintageIds, CancellationToken ct = default);
    Task<WineVintage> CreateAsync(WineVintage vintage, IEnumerable<WineGrape> grapes, CancellationToken ct = default);
    Task<bool> UpdateAsync(WineVintage vintage, IEnumerable<WineGrape> grapes, CancellationToken ct = default);
    Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
}