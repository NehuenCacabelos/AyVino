using AyVino.Api.Features.Uvas.DTOs;

namespace AyVino.Api.Features.Uvas.Services;

public interface IUvaService
{
    Task<UvaResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<UvaResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? tipoColor, CancellationToken ct = default);
    Task<UvaResponseDto> CreateAsync(CreateUvaRequestDto request, CancellationToken ct = default);
    Task<UvaResponseDto> UpdateAsync(int id, UpdateUvaRequestDto request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}