using AyVino.Api.Features.Cellars.Models;

namespace AyVino.Api.Features.Cellars.Repositories;

public interface ICellarRepository
{
    Task<Cellar?> GetByIdAsync(int cellarId, int userId, CancellationToken ct = default);
    Task<CellarSummaryRow?> GetSummaryByIdAsync(int cellarId, int userId, CancellationToken ct = default);
    Task<IEnumerable<CellarSummaryRow>> GetAllByUserAsync(int userId, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<bool> ExistsByNameAsync(int userId, string name, int? excludeCellarId, CancellationToken ct = default);
    Task<bool> HasItemsAsync(int cellarId, CancellationToken ct = default);
    Task<int> CreateAsync(int userId, string name, CancellationToken ct = default);
    Task<bool> UpdateNameAsync(int cellarId, int userId, string name, CancellationToken ct = default);
    Task<bool> DeleteAsync(int cellarId, int userId, CancellationToken ct = default);
}