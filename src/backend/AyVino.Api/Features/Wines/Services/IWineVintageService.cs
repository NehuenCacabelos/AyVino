using AyVino.Api.Common.Security;
using AyVino.Api.Features.Wines.DTOs;

namespace AyVino.Api.Features.Wines.Services;

public interface IWineVintageService
{
    Task<WineVintageResponseDto> GetByIdAsync(int wineId, int vintageId, Actor? actor = null, CancellationToken ct = default);
    Task<IEnumerable<WineVintageResponseDto>> GetAllByWineIdAsync(int wineId, Actor? actor = null, CancellationToken ct = default);
    Task<WineVintageResponseDto> CreateAsync(int wineId, CreateWineVintageRequestDto dto, Actor actor, CancellationToken ct = default);
    Task<WineVintageResponseDto> UpdateAsync(int wineId, int vintageId, UpdateWineVintageRequestDto dto, Actor actor, CancellationToken ct = default);
    Task<WineVintageResponseDto> ChangeStatusAsync(int wineId, int vintageId, ChangeWineVintageStatusRequestDto dto, CancellationToken ct = default);
    Task DeleteAsync(int wineId, int vintageId, CancellationToken ct = default);
    Task<IEnumerable<AdminWineVintageListItemDto>> GetPagedForAdminAsync(int pageNumber, int pageSize, string? status, CancellationToken ct = default);
}
