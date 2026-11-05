using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Auth.DTOs;

public record LoginRequestDto(
    [property: Required(ErrorMessage = "El correo electrónico es obligatorio."),
               StringLength(100, ErrorMessage = "El correo electrónico no puede superar los 100 caracteres.")] string Email,
    [property: Required(ErrorMessage = "La contraseña es obligatoria."),
               StringLength(128, ErrorMessage = "La contraseña no puede superar los 128 caracteres.")] string Password
);

