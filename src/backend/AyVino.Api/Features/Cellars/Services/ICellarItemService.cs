using AyVino.Api.Features.Cellars.DTOs;

namespace AyVino.Api.Features.Cellars.Services;

public interface ICellarItemService
{
    Task<CellarItemResponseDto> AddAsync(int userId, int cellarId, AddCellarItemRequestDto request, CancellationToken ct = default);
    Task<IReadOnlyList<CellarItemResponseDto>> GetAllAsync(int userId, int cellarId, int pageNumber, int pageSize, string? wineType, int? year, CancellationToken ct = default);
    Task<CellarItemResponseDto> GetAsync(int userId, int cellarId, int wineVintageId, CancellationToken ct = default);
    Task<CellarItemResponseDto> UpdateAsync(int userId, int cellarId, int wineVintageId, UpdateCellarItemRequestDto request, CancellationToken ct = default);
    Task RemoveAsync(int userId, int cellarId, int wineVintageId, CancellationToken ct = default);
}