namespace AyVino.Api.Features.Wineries.DTOs;

public record RegisterWineryResponseDto(
    WineryResponseDto Winery,
    string AccessToken,
    string TokenType,
    DateTime ExpiresAt);