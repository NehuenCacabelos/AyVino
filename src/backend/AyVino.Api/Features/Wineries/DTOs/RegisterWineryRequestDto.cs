namespace AyVino.Api.Features.Wineries.DTOs;

public record RegisterWineryRequestDto(
    // Owner user data (created with Role="Winery")
    string Username,
    string Email,
    string Password,
    // Winery data
    string WineryName,
    int LocationId,
    string? Description = null,
    int? FoundationYear = null,
    string? Website = null);