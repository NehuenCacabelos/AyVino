using AyVino.Api.Common.Security;
using AyVino.Api.Features.Reviews.DTOs;

namespace AyVino.Api.Features.Reviews.Services;

public interface IReviewService
{
    Task<ReviewResponseDto> CreateAsync(CreateReviewRequestDto request, int userId, CancellationToken ct = default);
    Task<ReviewResponseDto> UpdateAsync(int id, UpdateReviewRequestDto request, int userId, CancellationToken ct = default);
    Task DeleteAsync(int id, Actor actor, CancellationToken ct = default);
    Task DeleteAsync(int id, int userId, CancellationToken ct = default);
    Task<IEnumerable<ReviewResponseDto>> GetAllByVintageAsync(int wineVintageId, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<IEnumerable<ReviewResponseDto>> GetAllByWineAsync(int wineId, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<IEnumerable<AdminReviewListItemDto>> GetPagedForAdminAsync(
        int pageNumber,
        int pageSize,
        int? wineId = null,
        int? wineVintageId = null,
        int? userId = null,
        int? rating = null,
        CancellationToken ct = default);
}
