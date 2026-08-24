namespace AyVino.Api.Features.Users.DTOs;

public record CreateUserRequestDto(
    string NombreUsuario,
    string Email,
    string Password,
    string Rol = "Usuario",
    string? Bio = null,
    string? FotoPerfil = null
);

