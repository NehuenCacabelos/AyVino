using AyVino.Api.Features.Cellars.Models;

namespace AyVino.Api.Features.Cellars.Repositories;

public interface ICellarItemRepository
{
    Task<CellarItem?> GetAsync(int cellarId, int wineVintageId, CancellationToken ct = default);
    Task<CellarItemListRow?> GetRowAsync(int cellarId, int wineVintageId, CancellationToken ct = default);
    Task<IEnumerable<CellarItemListRow>> GetAllByCellarAsync(int cellarId, int pageNumber, int pageSize, int? wineType, int? year, CancellationToken ct = default);
    Task CreateAsync(CellarItem item, CancellationToken ct = default);
    Task<bool> UpdateAsync(int cellarId, int wineVintageId, int quantity, DateOnly? purchaseDate, string? notes, CancellationToken ct = default);
    Task<bool> DeleteAsync(int cellarId, int wineVintageId, CancellationToken ct = default);
    Task<IReadOnlyList<int>> GetVintageIdsAsync(int cellarId, CancellationToken ct = default);
}