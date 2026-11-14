using AyVino.Api.Features.Tastings.DTOs;

namespace AyVino.Api.Features.Tastings.Services;

public interface ITastingService
{
    Task<TastingResponseDto> CreateAsync(int userId, CreateTastingRequestDto request, CancellationToken ct = default);
    Task<TastingExecutionResult> RecordAsync(int userId, int wineVintageId, int? cellarId, decimal? rating, string? comment, DateTime? tastedAt, CancellationToken ct = default);
    Task<IEnumerable<TastingListItemDto>> GetPagedByUserIdAsync(int userId, int pageNumber, int pageSize, int? wineVintageId = null, CancellationToken ct = default);
}
