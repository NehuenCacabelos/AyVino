using AyVino.Api.Features.Tastings.DTOs;

namespace AyVino.Api.Features.Tastings.Repositories;

public interface ITastingRepository
{
    Task<TastingResponseDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<TastingListItemDto>> GetPagedByUserIdAsync(int userId, int pageNumber, int pageSize, int? wineVintageId = null, CancellationToken ct = default);
    Task<TastingExecutionResult> RecordTastingInTransactionAsync(int userId, int wineVintageId, int? cellarId, decimal? rating, string? comment, DateTime tastedAt, CancellationToken ct = default);
}
