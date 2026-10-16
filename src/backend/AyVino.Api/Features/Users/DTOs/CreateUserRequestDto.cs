using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Users.DTOs;

public record CreateUserRequestDto(
    [property: Required(ErrorMessage = "El nombre de usuario es obligatorio."),
               StringLength(100, ErrorMessage = "El nombre de usuario no puede superar los 100 caracteres.")] string Username,
    [property: Required(ErrorMessage = "El correo electrónico es obligatorio."),
               EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido."),
               StringLength(100, ErrorMessage = "El correo electrónico no puede superar los 100 caracteres.")] string Email,
    [property: Required(ErrorMessage = "La contraseña es obligatoria."),
               StringLength(128, MinimumLength = 8, ErrorMessage = "La contraseña debe tener entre 8 y 128 caracteres.")] string Password,
    [property: StringLength(100, ErrorMessage = "El rol no puede superar los 100 caracteres.")] string Role = "User",
    [property: StringLength(1000, ErrorMessage = "La biografía no puede superar los 1000 caracteres.")] string? Bio = null,
    [property: StringLength(100, ErrorMessage = "La foto no puede superar los 100 caracteres.")] string? Photo = null
);

