using System.Data;
using AyVino.Api.Features.Wineries.Models;

namespace AyVino.Api.Features.Wineries.Repositories;

public interface IWineryRepository
{
    Task<Winery?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Winery?> GetByUserIdAsync(int userId, CancellationToken ct = default);
    Task<IEnumerable<Winery>> GetAllAsync(int pageNumber, int pageSize, int? status = null, int? locationId = null, CancellationToken ct = default);
    Task<Winery> CreateAsync(Winery winery, CancellationToken ct = default);
    Task<bool> UpdateAsync(Winery winery, CancellationToken ct = default);
    Task<bool> UpdateLogoImageIdAsync(int wineryId, Guid? logoImageId, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default) => Task.FromResult(true);
    Task<bool> UpdateLogoImageIdAsync(int wineryId, Guid? logoImageId, CancellationToken ct = default) => Task.FromResult(true);
    Task<bool> UpdateBannerImageIdAsync(int wineryId, Guid? bannerImageId, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default) => Task.FromResult(true);
    Task<bool> UpdateBannerImageIdAsync(int wineryId, Guid? bannerImageId, CancellationToken ct = default) => Task.FromResult(true);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
    Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default);
}
