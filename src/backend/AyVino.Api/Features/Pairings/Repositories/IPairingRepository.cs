using AyVino.Api.Features.Pairings.Models;

namespace AyVino.Api.Features.Pairings.Repositories;

public interface IPairingRepository
{
    Task<Pairing?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<Pairing>> GetAllAsync(int pageNumber, int pageSize, int? category = null, CancellationToken ct = default);
    Task<int> CreateAsync(Pairing pairing, CancellationToken ct = default);
    Task<bool> UpdateAsync(Pairing pairing, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);

    Task<IEnumerable<Pairing>> GetByWineIdAsync(int wineId, CancellationToken ct = default);
    Task AddToWineAsync(int wineId, int pairingId, CancellationToken ct = default);
    Task<bool> RemoveFromWineAsync(int wineId, int pairingId, CancellationToken ct = default);
    Task<bool> IsAssociatedAsync(int wineId, int pairingId, CancellationToken ct = default);
}