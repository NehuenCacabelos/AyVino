using AyVino.Api.Common.Models;
using AyVino.Api.Features.Grapes.DTOs;

namespace AyVino.Api.Features.Grapes.Services;

public interface IGrapeService
{
    Task<GrapeResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<GrapeResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? colorType, CancellationToken ct = default);
    Task<PagedResult<GrapeResponseDto>> GetAllPagedAsync(int pageNumber, int pageSize, string? colorType, CancellationToken ct = default) =>
        Task.FromResult(new PagedResult<GrapeResponseDto>([], 0));
    Task<GrapeResponseDto> CreateAsync(CreateGrapeRequestDto request, CancellationToken ct = default);
    Task<GrapeResponseDto> UpdateAsync(int id, UpdateGrapeRequestDto request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}