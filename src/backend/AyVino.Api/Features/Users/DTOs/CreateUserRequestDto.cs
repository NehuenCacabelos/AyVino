namespace AyVino.Api.Features.Users.DTOs;

public record CreateUserRequestDto(
    string Username,
    string Email,
    string Password,
    string Role = "User",
    string? Bio = null,
    string? Photo = null
);

