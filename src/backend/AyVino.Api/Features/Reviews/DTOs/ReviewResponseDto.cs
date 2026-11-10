namespace AyVino.Api.Features.Reviews.DTOs;

public record ReviewResponseDto(
    int Id,
    int UserId,
    string UserName,
    int WineVintageId,
    int? VintageYear,
    int Rating,
    string? Comment,
    DateTime CreatedAt,
    DateTime? UpdatedAt);