using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Cellars.DTOs;

public record CreateCellarRequestDto(
    [property: Required(ErrorMessage = "El nombre de la cava es obligatorio."), StringLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres.")] string Name);