namespace AyVino.Api.Features.Wines.DTOs;

public record WineDuplicateCheckResponseDto(
    bool HasMatch,
    WineResponseDto? MatchedWine,
    IReadOnlyList<int> ExistingYears);
