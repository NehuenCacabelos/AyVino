using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;

namespace AyVino.Api.Features.Wines.Repositories;

public interface IWineRepository
{
    Task<Wine?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<WineGrape>> GetGrapesByWineIdAsync(int wineId, CancellationToken ct = default);
    Task<IEnumerable<Wine>> GetAllAsync(int pageNumber, int pageSize, int? wineryId = null, int? grapeId = null, int? yearFrom = null, int? yearTo = null, CancellationToken ct = default);
    Task<Wine> CreateAsync(CreateWineRequestDto dto, WineType wineType, IEnumerable<WineGrape> grapes, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateWineRequestDto dto, WineType wineType, IEnumerable<WineGrape> grapes, CancellationToken ct = default);
    Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default);
}