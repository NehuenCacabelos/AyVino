using AyVino.Api.Features.Grapes.Models;

namespace AyVino.Api.Features.Grapes.Repositories;

public interface IGrapeRepository
{
    Task<Grape?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<Grape>> GetAllAsync(int pageNumber, int pageSize, int? colorType = null, CancellationToken ct = default);
    Task<int> CountAsync(int? colorType = null, CancellationToken ct = default) => Task.FromResult(0);
    Task<int> CreateAsync(Grape grape, CancellationToken ct = default);
    Task<bool> UpdateAsync(Grape grape, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
}