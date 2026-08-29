using AyVino.Api.Features.Wineries.DTOs;

namespace AyVino.Api.Features.Wineries.Services;

public interface IWineryService
{
    Task<WineryResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<WineryResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? status = null, int? locationId = null, CancellationToken ct = default);
    Task<WineryResponseDto> CreateAsync(CreateWineryRequestDto dto, CancellationToken ct = default);
    Task<WineryResponseDto> UpdateAsync(int id, UpdateWineryRequestDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task<WineryResponseDto> ChangeStatusAsync(int id, string status, CancellationToken ct = default);
    Task<RegisterWineryResponseDto> RegisterWineryAsync(RegisterWineryRequestDto dto, CancellationToken ct = default);
}