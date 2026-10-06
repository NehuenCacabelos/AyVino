using AyVino.Api.Features.Wines.DTOs;

namespace AyVino.Api.Features.Wines.Services;

public interface IWineVintageService
{
    Task<WineVintageResponseDto> GetByIdAsync(int wineId, int vintageId, CancellationToken ct = default);
    Task<IEnumerable<WineVintageResponseDto>> GetAllByWineIdAsync(int wineId, CancellationToken ct = default);
    Task<WineVintageResponseDto> CreateAsync(int wineId, CreateWineVintageRequestDto dto, int userId, CancellationToken ct = default);
    Task<WineVintageResponseDto> UpdateAsync(int wineId, int vintageId, UpdateWineVintageRequestDto dto, CancellationToken ct = default);
    Task<WineVintageResponseDto> ChangeStatusAsync(int wineId, int vintageId, ChangeWineVintageStatusRequestDto dto, CancellationToken ct = default);
    Task DeleteAsync(int wineId, int vintageId, CancellationToken ct = default);
}