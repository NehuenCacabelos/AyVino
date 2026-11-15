using AyVino.Api.Features.Users.DTOs;

namespace AyVino.Api.Features.Auth.DTOs;

public record LoginResponseDto(
    string AccessToken,
    string RefreshToken,
    string TokenType,
    DateTime ExpiresAt,
    UserResponseDto User
);
