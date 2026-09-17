namespace AyVino.Api.Features.Users.DTOs;
 
public record RegisterUserRequestDto(
    string Username,
    string Email,
    string Password,
    string? Bio = null,
    string? Photo = null
);

