namespace AyVino.Api.Features.Auth.DTOs;

public record RefreshResponseDto(
    string AccessToken,
    string RefreshToken,
    string TokenType,
    DateTime ExpiresAt
);
