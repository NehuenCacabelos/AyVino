using AyVino.Api.Features.Cities.Models;

namespace AyVino.Api.Features.Cities.Repositories;

public interface ICityRepository
{
    Task<City?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<City?> GetByNameAndStateAsync(string name, int stateId, CancellationToken ct = default);
    Task<IEnumerable<City>> GetAllAsync(int pageNumber, int pageSize, int? stateId, int? status, CancellationToken ct = default);
    Task<int> CreateAsync(City city, CancellationToken ct = default);
    Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
}