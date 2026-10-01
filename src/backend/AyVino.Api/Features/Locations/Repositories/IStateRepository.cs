using AyVino.Api.Features.Locations.Models;

namespace AyVino.Api.Features.Locations.Repositories;

public interface IStateRepository
{
    Task<State?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<State>> GetAllAsync(CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
}