using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Reviews.DTOs;
using AyVino.Api.Features.Reviews.Repositories;

namespace AyVino.Api.Features.Reviews.Services;

public class ReviewService(IReviewRepository reviewRepository) : IReviewService
{
    public async Task<ReviewResponseDto> CreateAsync(CreateReviewRequestDto request, int userId, CancellationToken ct = default)
    {
        ValidateRating(request.Rating);

        if (await reviewRepository.ExistsForUserAndVintageAsync(userId, request.WineVintageId, ct))
            throw new ConflictException("Ya reseñaste esta cosecha.");

        var id = await reviewRepository.CreateAsync(request.ToEntity(userId), ct);

        return await reviewRepository.GetResponseByIdAsync(id, ct)
            ?? throw new NotFoundException($"Review con ID {id} no encontrada.");
    }

    public async Task<ReviewResponseDto> UpdateAsync(int id, UpdateReviewRequestDto request, int userId, CancellationToken ct = default)
    {
        ValidateRating(request.Rating);

        var existing = await reviewRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Review con ID {id} no encontrada.");

        if (existing.UserId != userId)
            throw new UnauthorizedException("No podés editar la reseña de otro usuario.");

        var updated = existing with
        {
            Rating = request.Rating,
            Comment = request.Comment,
            UpdatedAt = DateTime.UtcNow
        };

        var success = await reviewRepository.UpdateAsync(updated, ct);
        if (!success) throw new NotFoundException($"Review con ID {id} no encontrada.");

        return await reviewRepository.GetResponseByIdAsync(id, ct)
            ?? throw new NotFoundException($"Review con ID {id} no encontrada.");
    }

    public async Task DeleteAsync(int id, int userId, CancellationToken ct = default)
    {
        var existing = await reviewRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Review con ID {id} no encontrada.");

        if (existing.UserId != userId)
            throw new UnauthorizedException("No podés borrar la reseña de otro usuario.");

        var success = await reviewRepository.DeleteAsync(id, ct);
        if (!success) throw new NotFoundException($"Review con ID {id} no encontrada.");
    }

    public async Task<IEnumerable<ReviewResponseDto>> GetAllByVintageAsync(int wineVintageId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        ValidatePagination(pageNumber, pageSize);
        return await reviewRepository.GetAllByVintageAsync(wineVintageId, pageNumber, pageSize, ct);
    }

    public async Task<IEnumerable<ReviewResponseDto>> GetAllByWineAsync(int wineId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        ValidatePagination(pageNumber, pageSize);
        return await reviewRepository.GetAllByWineAsync(wineId, pageNumber, pageSize, ct);
    }

    private static void ValidateRating(int rating)
    {
        if (rating is < 1 or > 5)
            throw new ValidationException("El rating debe estar entre 1 y 5.");
    }

    private static void ValidatePagination(int pageNumber, int pageSize)
    {
        if (pageNumber <= 0)
            throw new ValidationException("pageNumber debe ser mayor a 0.");
        if (pageSize is < 1 or > 100)
            throw new ValidationException("pageSize debe estar entre 1 y 100.");
    }
}