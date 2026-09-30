namespace AyVino.Api.Features.Users.DTOs;

public record UserResponseDto(
    int Id,
    string Username,
    string Email,
    string Role,
    DateTime RegisterDate,
    bool IsActive,
    string? Photo,
    string? Bio
);

