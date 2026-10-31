using System.Data;
using AyVino.Api.Features.UserWines.Models;

namespace AyVino.Api.Features.UserWines.Repositories;

public interface IUserWineRepository
{
    Task<UserWine?> GetAsync(int userId, int wineId, CancellationToken ct = default);
    Task<IEnumerable<UserWineListRow>> GetAllByUserAsync(int userId, int pageNumber, int pageSize, bool? wanted, bool? tried, bool? favorite, CancellationToken ct = default);
    // Crea la fila o suma las marcas pedidas a las que ya había (nunca apaga una marca).
    Task MarkAsync(int userId, int wineId, bool wanted, bool tried, bool favorite, CancellationToken ct = default);
    Task MarkAsync(int userId, int wineId, bool wanted, bool tried, bool favorite, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default) =>
        MarkAsync(userId, wineId, wanted, tried, favorite, ct);
    // Apaga deseado y/o favorito; si la fila queda sin ninguna marca, la borra.
    Task UnmarkAsync(int userId, int wineId, bool clearWanted, bool clearFavorite, CancellationToken ct = default);
}
