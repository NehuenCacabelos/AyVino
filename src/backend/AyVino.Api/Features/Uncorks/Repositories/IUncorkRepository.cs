using AyVino.Api.Features.Uncorks.DTOs;

namespace AyVino.Api.Features.Uncorks.Repositories;

public interface IUncorkRepository
{
    Task<UncorkResponseDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<UncorkListItemDto>> GetPagedByUserIdAsync(int userId, int pageNumber, int pageSize, int? wineVintageId = null, CancellationToken ct = default);
    Task<UncorkExecutionResult> RecordUncorkInTransactionAsync(int userId, int wineVintageId, int? cellarId, decimal? rating, string? comment, DateTime uncorkedAt, CancellationToken ct = default);
}
