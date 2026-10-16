using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Users.DTOs;

public record UpdateUserProfileRequestDto(
    [property: Required(ErrorMessage = "El nombre de usuario es obligatorio."),
               StringLength(100, ErrorMessage = "El nombre de usuario no puede superar los 100 caracteres.")] string Username,
    [property: StringLength(1000, ErrorMessage = "La biografía no puede superar los 1000 caracteres.")] string? Bio = null,
    [property: StringLength(100, ErrorMessage = "La foto no puede superar los 100 caracteres.")] string? Photo = null
);

