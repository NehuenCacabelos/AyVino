namespace AyVino.Api.Features.Users.DTOs;

public record UpdateUserProfileRequestDto(
    string Username,
    string? Bio,
    string? Photo
);

