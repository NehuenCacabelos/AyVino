using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Auth.DTOs;

public class ChangePasswordRequestDto
{
    [Required(ErrorMessage = "La contraseña actual es obligatoria."),
     StringLength(128, ErrorMessage = "La contraseña actual no puede superar los 128 caracteres.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "La nueva contraseña es obligatoria."),
     StringLength(128, MinimumLength = 8, ErrorMessage = "La nueva contraseña debe tener entre 8 y 128 caracteres.")]
    public string NewPassword { get; set; } = string.Empty;
}

