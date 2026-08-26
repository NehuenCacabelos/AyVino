using AyVino.Api.Features.Ubicaciones.Models;

namespace AyVino.Api.Features.Ubicaciones.Repositories;

public interface IUbicacionRepository
{
    Task<Ubicacion?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<Ubicacion>> GetAllAsync(int pageNumber, int pageSize, string? pais, CancellationToken ct = default);
    Task<int> CreateAsync(Ubicacion ubicacion, CancellationToken ct = default);
    Task<bool> UpdateAsync(Ubicacion ubicacion, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
}