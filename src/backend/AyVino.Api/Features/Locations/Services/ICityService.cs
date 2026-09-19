using AyVino.Api.Features.Cities.DTOs;

namespace AyVino.Api.Features.Cities.Services;

public interface ICityService
{
    Task<CityResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<CityResponseDto>> GetAllAsync(int pageNumber, int pageSize, int? stateId, string? status, CancellationToken ct = default);
    Task<CityResponseDto> GetOrCreateAsync(CreateCityRequestDto dto, CancellationToken ct = default);
    Task<CityResponseDto> UpdateStatusAsync(int id, UpdateCityStatusRequestDto dto, CancellationToken ct = default);
}