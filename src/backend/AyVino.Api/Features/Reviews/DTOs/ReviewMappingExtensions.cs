using AyVino.Api.Features.Reviews.Models;

namespace AyVino.Api.Features.Reviews.DTOs;

public static class ReviewMappingExtensions
{
    public static Review ToEntity(this CreateReviewRequestDto dto, int userId) => new()
    {
        UserId = userId,
        WineVintageId = dto.WineVintageId,
        Rating = dto.Rating,
        Comment = dto.Comment,
        CreatedAt = DateTime.UtcNow
    };
}