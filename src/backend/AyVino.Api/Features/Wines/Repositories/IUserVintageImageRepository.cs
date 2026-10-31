using System.Data;

namespace AyVino.Api.Features.Wines.Repositories;

public interface IUserVintageImageRepository
{
    Task<Guid?> GetImageIdAsync(int userId, int wineVintageId, CancellationToken ct = default);
    Task UpsertAsync(int userId, int wineVintageId, Guid imageId, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default);
    Task<bool> DeleteAsync(int userId, int wineVintageId, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default);
}
