using AyVino.Api.Features.Locations.DTOs;

namespace AyVino.Api.Features.Locations.Services;

public interface ILocationService
{
    Task<LocationResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<LocationResponseDto> CreateAsync(CreateLocationRequestDto dto, CancellationToken ct = default);
}