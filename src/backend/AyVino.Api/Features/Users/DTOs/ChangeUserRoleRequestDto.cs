using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Users.DTOs;

public record ChangeUserRoleRequestDto(
    [property: Required(ErrorMessage = "El rol es obligatorio."),
               StringLength(20, ErrorMessage = "El rol no puede superar los 20 caracteres.")] string Role);
