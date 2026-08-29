using AyVino.Api.Features.Locations.DTOs;

namespace AyVino.Api.Features.Locations.Services;

public interface ILocationService
{
    Task<LocationResponseDto> CreateAsync(CreateLocationRequestDto dto, CancellationToken ct = default);
    Task<LocationResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<LocationResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? country, CancellationToken ct = default);
    Task<LocationResponseDto> UpdateAsync(int id, UpdateLocationRequestDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}