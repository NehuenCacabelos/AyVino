using AyVino.Api.Features.Uncorks.DTOs;

namespace AyVino.Api.Features.Uncorks.Services;

public interface IUncorkService
{
    Task<UncorkExecutionResult> RecordAsync(
        int userId,
        int wineVintageId,
        int? cellarId,
        decimal? rating,
        string? comment,
        DateTime? uncorkedAt,
        CancellationToken ct = default);

    Task<UncorkResponseDto> CreateAsync(int userId, CreateUncorkRequestDto request, CancellationToken ct = default);

    Task<IEnumerable<UncorkListItemDto>> GetPagedByUserIdAsync(
        int userId,
        int pageNumber,
        int pageSize,
        int? wineVintageId = null,
        CancellationToken ct = default);
}
