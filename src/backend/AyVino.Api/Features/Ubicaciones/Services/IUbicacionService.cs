using AyVino.Api.Features.Ubicaciones.DTOs;

namespace AyVino.Api.Features.Ubicaciones.Services;

public interface IUbicacionService
{
    Task<UbicacionResponseDto> CreateAsync(CreateUbicacionRequestDto dto, CancellationToken ct = default);
    Task<UbicacionResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<UbicacionResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? pais, CancellationToken ct = default);
    Task<UbicacionResponseDto> UpdateAsync(int id, UpdateUbicacionRequestDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}