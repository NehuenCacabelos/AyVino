using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Auth.DTOs;

public record RevokeTokenRequestDto(
    [property: Required(ErrorMessage = "El token de refresco es obligatorio."),
               StringLength(500, ErrorMessage = "El token de refresco no puede superar los 500 caracteres.")] string RefreshToken
);

