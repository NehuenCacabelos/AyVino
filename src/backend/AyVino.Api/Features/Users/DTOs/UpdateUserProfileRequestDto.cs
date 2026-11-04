using System.ComponentModel.DataAnnotations;
using AyVino.Api.Features.Users.Enums;

namespace AyVino.Api.Features.Users.DTOs;

public record UpdateUserProfileRequestDto(
    [property: Required(ErrorMessage = "El nombre de usuario es obligatorio."),
               StringLength(100, ErrorMessage = "El nombre de usuario no puede superar los 100 caracteres.")] string Username,
    [property: StringLength(1000, ErrorMessage = "La biografía no puede superar los 1000 caracteres.")] string? Bio = null,
    DateOnly? BirthDate = null,
    Gender? Gender = null
);
