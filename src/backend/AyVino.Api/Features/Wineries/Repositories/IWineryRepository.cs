using AyVino.Api.Features.Wineries.Models;

namespace AyVino.Api.Features.Wineries.Repositories;

public interface IWineryRepository
{
    Task<Winery?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<Winery>> GetAllAsync(int pageNumber, int pageSize, int? status = null, int? locationId = null, CancellationToken ct = default);
    Task<Winery> CreateAsync(Winery winery, CancellationToken ct = default);
    Task<bool> UpdateAsync(Winery winery, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
    Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default);
}