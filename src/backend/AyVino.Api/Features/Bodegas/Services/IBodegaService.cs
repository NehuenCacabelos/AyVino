using AyVino.Api.Features.Bodegas.DTOs;

namespace AyVino.Api.Features.Bodegas.Services;

public interface IBodegaService
{
    Task<BodegaResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<BodegaResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? estado = null, int? ubicacionId = null, CancellationToken ct = default);
    Task<BodegaResponseDto> CreateAsync(CreateBodegaRequestDto dto, CancellationToken ct = default);
    Task<BodegaResponseDto> UpdateAsync(int id, UpdateBodegaRequestDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task<BodegaResponseDto> CambiarEstadoAsync(int id, string estado, CancellationToken ct = default);
    Task<RegistrarBodegaResponseDto> RegistrarBodegaAsync(RegistrarBodegaRequestDto dto, CancellationToken ct = default);
}