using AyVino.Api.Features.Cellars.DTOs;

namespace AyVino.Api.Features.Cellars.Services;

public interface ICellarService
{
    Task<IReadOnlyList<CellarResponseDto>> GetAllByUserAsync(int userId, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<CellarResponseDto> GetByIdAsync(int userId, int cellarId, CancellationToken ct = default);
    Task<CellarResponseDto> CreateAsync(int userId, CreateCellarRequestDto request, CancellationToken ct = default);
    Task<CellarResponseDto> RenameAsync(int userId, int cellarId, UpdateCellarRequestDto request, CancellationToken ct = default);
    Task DeleteAsync(int userId, int cellarId, CancellationToken ct = default);
}