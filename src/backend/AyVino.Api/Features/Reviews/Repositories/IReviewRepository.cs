using AyVino.Api.Features.Reviews.DTOs;
using AyVino.Api.Features.Reviews.Models;

namespace AyVino.Api.Features.Reviews.Repositories;

public interface IReviewRepository
{
    Task<Review?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ReviewResponseDto?> GetResponseByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<ReviewResponseDto>> GetAllByVintageAsync(int wineVintageId, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<IEnumerable<ReviewResponseDto>> GetAllByWineAsync(int wineId, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<bool> ExistsForUserAndVintageAsync(int userId, int wineVintageId, CancellationToken ct = default);
    Task<int> CreateAsync(Review review, CancellationToken ct = default);
    Task<bool> UpdateAsync(Review review, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}