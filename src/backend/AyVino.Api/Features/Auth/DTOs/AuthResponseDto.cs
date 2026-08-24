using AyVino.Api.Features.Users.DTOs;

namespace AyVino.Api.Features.Auth.DTOs;

public record AuthResponseDto(
    string AccessToken,
    string TokenType,
    DateTime ExpiresAt,
    UserResponseDto User
);

