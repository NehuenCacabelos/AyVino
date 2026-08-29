using AyVino.Api.Features.Bodegas.DTOs;
using AyVino.Api.Features.Bodegas.Models;

namespace AyVino.Api.Features.Bodegas.Repositories;

public interface IBodegaRepository
{
    Task<Bodega?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<Bodega>> GetAllAsync(int pageNumber, int pageSize, int? estado = null, int? ubicacionId = null, CancellationToken ct = default);
    Task<Bodega> CreateAsync(int? usuarioId, CreateBodegaRequestDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateBodegaRequestDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
    Task<bool> UpdateEstadoAsync(int id, int estado, CancellationToken ct = default);
}