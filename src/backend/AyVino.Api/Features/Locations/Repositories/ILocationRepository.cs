using AyVino.Api.Features.Locations.Models;

namespace AyVino.Api.Features.Locations.Repositories;

public interface ILocationRepository
{
    Task<Location?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<Location>> GetAllAsync(int pageNumber, int pageSize, string? country, CancellationToken ct = default);
    Task<int> CreateAsync(Location location, CancellationToken ct = default);
    Task<bool> UpdateAsync(Location location, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
}