using AyVino.Api.Features.Locations.DTOs;
using AyVino.Api.Features.Locations.Models;

namespace AyVino.Api.Features.Locations.Repositories;

public interface ILocationRepository
{
    Task<LocationResponseDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<int> CreateAsync(Location location, CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
}