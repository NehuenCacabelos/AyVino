using AyVino.Api.Features.Reviews.DTOs;

namespace AyVino.Api.Features.Reviews.Services;

public interface IReviewService
{
    Task<ReviewResponseDto> CreateAsync(CreateReviewRequestDto request, int userId, CancellationToken ct = default);
    Task<ReviewResponseDto> UpdateAsync(int id, UpdateReviewRequestDto request, int userId, CancellationToken ct = default);
    Task DeleteAsync(int id, int userId, CancellationToken ct = default);
    Task<IEnumerable<ReviewResponseDto>> GetAllByVintageAsync(int wineVintageId, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<IEnumerable<ReviewResponseDto>> GetAllByWineAsync(int wineId, int pageNumber, int pageSize, CancellationToken ct = default);
}