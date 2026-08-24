namespace AyVino.Api.Features.Users.DTOs;

public record UserResponseDto(
    int Id,
    string NombreUsuario,
    string Email,
    string Rol,
    DateTime FechaRegistro,
    bool Activo,
    string? FotoPerfil,
    string? Bio
);

