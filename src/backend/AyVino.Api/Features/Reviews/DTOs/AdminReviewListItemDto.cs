namespace AyVino.Api.Features.Reviews.DTOs;

public record AdminReviewListItemDto(
    int Id,
    int Rating,
    string? Comment,
    DateTime CreatedAt,
    int? UserId,
    string? Username,
    int WineVintageId,
    int WineId,
    string WineName,
    int? Year);
