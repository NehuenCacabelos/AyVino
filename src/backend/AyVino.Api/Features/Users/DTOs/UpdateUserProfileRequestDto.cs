namespace AyVino.Api.Features.Users.DTOs;

public record UpdateUserProfileRequestDto(
    string NombreUsuario,
    string? Bio,
    string? FotoPerfil
);

