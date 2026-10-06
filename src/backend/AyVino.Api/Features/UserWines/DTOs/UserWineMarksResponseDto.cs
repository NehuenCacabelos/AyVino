namespace AyVino.Api.Features.UserWines.DTOs;

public record UserWineMarksResponseDto(
    int WineId,
    bool IsWanted,
    bool IsTried,
    bool IsFavorite);