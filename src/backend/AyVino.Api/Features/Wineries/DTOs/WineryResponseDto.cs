namespace AyVino.Api.Features.Wineries.DTOs;

public record WineryResponseDto(
    int Id,
    string Name,
    string? Description,
    int LocationId,
    int? FoundationYear,
    string? Website,
    int? UserId,
    string Status,
    DateTime RegisterDate);