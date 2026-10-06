using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Reviews.DTOs;
using AyVino.Api.Features.Reviews.Models;
using AyVino.Api.Features.Reviews.Repositories;
using AyVino.Api.Features.Reviews.Services;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;

namespace AyVino.UnitTests;

public class ReviewSecurityTests
{
    [Fact]
    public async Task ReviewService_UpdateAsync_ThrowsForbiddenException_WhenUserIsNotOwner()
    {
        // Arrange
        var fakeRepo = new FakeReviewRepository
        {
            ExistingReview = new Review
            {
                Id = 10,
                UserId = 42, // Propietario original
                WineVintageId = 5,
                Rating = 4,
                Comment = "Gran vino",
                CreatedAt = DateTime.UtcNow
            }
        };

        var service = new ReviewService(fakeRepo, new FakeWineVintageRepository());
        var updateDto = new UpdateReviewRequestDto(Rating: 5, Comment: "Modificado");

        // Act & Assert (usuario 99 intenta modificar reseña de usuario 42)
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateAsync(id: 10, updateDto, userId: 99));

        Assert.Contains("otro usuario", ex.Message);
    }

    [Fact]
    public async Task ReviewService_DeleteAsync_ThrowsForbiddenException_WhenUserIsNotOwner()
    {
        // Arrange
        var fakeRepo = new FakeReviewRepository
        {
            ExistingReview = new Review
            {
                Id = 10,
                UserId = 42, // Propietario original
                WineVintageId = 5,
                Rating = 4,
                Comment = "Gran vino",
                CreatedAt = DateTime.UtcNow
            }
        };

        var service = new ReviewService(fakeRepo, new FakeWineVintageRepository());

        // Act & Assert (usuario 99 intenta borrar reseña de usuario 42)
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.DeleteAsync(id: 10, userId: 99));

        Assert.Contains("otro usuario", ex.Message);
    }

    [Fact]
    public async Task ReviewService_UpdateAsync_Succeeds_WhenUserIsOwner()
    {
        // Arrange
        var fakeRepo = new FakeReviewRepository
        {
            ExistingReview = new Review
            {
                Id = 10,
                UserId = 42,
                WineVintageId = 5,
                Rating = 4,
                Comment = "Original",
                CreatedAt = DateTime.UtcNow
            }
        };

        var service = new ReviewService(fakeRepo, new FakeWineVintageRepository());
        var updateDto = new UpdateReviewRequestDto(Rating: 5, Comment: "Excelente");

        // Act
        var result = await service.UpdateAsync(id: 10, updateDto, userId: 42);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Rating);
        Assert.Equal("Excelente", result.Comment);
    }

    [Fact]
    public async Task ReviewService_CreateAsync_ThrowsNotFoundException_WhenWineVintageDoesNotExist()
    {
        // Arrange
        var fakeRepo = new FakeReviewRepository();
        var fakeVintageRepo = new FakeWineVintageRepository { ExistsResult = false };
        var service = new ReviewService(fakeRepo, fakeVintageRepo);
        var createDto = new CreateReviewRequestDto(WineVintageId: 999, Rating: 5, Comment: "Excelente");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            service.CreateAsync(createDto, userId: 1));

        Assert.Contains("999", ex.Message);
    }

    private sealed class FakeReviewRepository : IReviewRepository
    {
        public Review? ExistingReview { get; set; }

        public Task<Review?> GetByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingReview?.Id == id ? ExistingReview : null);

        public Task<ReviewResponseDto?> GetResponseByIdAsync(int id, CancellationToken ct = default)
        {
            if (ExistingReview is null || ExistingReview.Id != id)
                return Task.FromResult<ReviewResponseDto?>(null);

            return Task.FromResult<ReviewResponseDto?>(new ReviewResponseDto(
                ExistingReview.Id,
                ExistingReview.UserId,
                "testuser",
                ExistingReview.WineVintageId,
                2022,
                ExistingReview.Rating,
                ExistingReview.Comment,
                ExistingReview.CreatedAt,
                ExistingReview.UpdatedAt
            ));
        }

        public Task<IEnumerable<ReviewResponseDto>> GetAllByVintageAsync(int wineVintageId, int pageNumber, int pageSize, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<ReviewResponseDto>>([]);

        public Task<IEnumerable<ReviewResponseDto>> GetAllByWineAsync(int wineId, int pageNumber, int pageSize, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<ReviewResponseDto>>([]);

        public Task<bool> ExistsForUserAndVintageAsync(int userId, int wineVintageId, CancellationToken ct = default) =>
            Task.FromResult(false);

        public Task<int> CreateAsync(Review review, CancellationToken ct = default) =>
            Task.FromResult(review.Id);

        public Task<bool> UpdateAsync(Review review, CancellationToken ct = default)
        {
            ExistingReview = review;
            return Task.FromResult(true);
        }

        public Task<bool> DeleteAsync(int id, CancellationToken ct = default)
        {
            if (ExistingReview?.Id == id)
            {
                ExistingReview = null;
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }
    }

    private sealed class FakeWineVintageRepository : IWineVintageRepository
    {
        public bool ExistsResult { get; set; } = true;

        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistsResult);

        public Task<WineVintage?> GetByIdAsync(int id, CancellationToken ct = default) =>
            throw new NotImplementedException();

        public Task<IEnumerable<WineVintage>> GetAllByWineIdAsync(int wineId, CancellationToken ct = default) =>
            throw new NotImplementedException();

        public Task<IEnumerable<WineGrape>> GetGrapesByVintageIdAsync(int vintageId, CancellationToken ct = default) =>
            throw new NotImplementedException();

        public Task<IEnumerable<WineGrape>> GetGrapesByVintageIdsAsync(IEnumerable<int> vintageIds, CancellationToken ct = default) =>
            throw new NotImplementedException();

        public Task<WineVintage> CreateAsync(WineVintage vintage, IEnumerable<WineGrape> grapes, CancellationToken ct = default) =>
            throw new NotImplementedException();

        public Task<bool> UpdateAsync(WineVintage vintage, IEnumerable<WineGrape> grapes, CancellationToken ct = default) =>
            throw new NotImplementedException();

        public Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default) =>
            throw new NotImplementedException();

        public Task<bool> DeleteAsync(int id, CancellationToken ct = default) =>
            throw new NotImplementedException();
    }
}

