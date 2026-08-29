namespace AyVino.Api.Features.Wineries.DTOs;

public record CreateWineryRequestDto(
    string Name,
    int LocationId,
    string? Description = null,
    int? FoundationYear = null,
    string? Website = null);