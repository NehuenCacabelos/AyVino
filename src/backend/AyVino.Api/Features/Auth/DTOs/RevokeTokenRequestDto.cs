namespace AyVino.Api.Features.Auth.DTOs;

public record RevokeTokenRequestDto(
    string RefreshToken
);
