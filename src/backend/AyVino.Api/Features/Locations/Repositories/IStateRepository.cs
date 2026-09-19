using AyVino.Api.Features.States.Models;

namespace AyVino.Api.Features.States.Repositories;

public interface IStateRepository
{
    Task<State?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<State>> GetAllAsync(CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
}