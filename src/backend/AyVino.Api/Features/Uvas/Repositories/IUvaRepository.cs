using AyVino.Api.Features.Uvas.Models;

namespace AyVino.Api.Features.Uvas.Repositories;

public interface IUvaRepository
{
    Task<Uva?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<Uva>> GetAllAsync(int pageNumber, int pageSize, int? tipoColor = null, CancellationToken ct = default);
    Task<int> CreateAsync(Uva uva, CancellationToken ct = default);
    Task<bool> UpdateAsync(Uva uva, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
}