using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Wineries.DTOs;

public record ChangeWineryStatusRequestDto(
    [property: Required(ErrorMessage = "El estado es obligatorio."),
               StringLength(20, ErrorMessage = "El estado no puede superar los 20 caracteres.")] string Status);


