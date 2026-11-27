using System.ComponentModel.DataAnnotations;
using AyVino.Api.Features.Pairings.Enums;

namespace AyVino.Api.Features.Pairings.DTOs;

public record UpdatePairingRequestDto(
    [property: Required(ErrorMessage = "El nombre del maridaje es obligatorio."),
               StringLength(100, ErrorMessage = "El nombre del maridaje no puede superar los 100 caracteres.")] string Name,
    [property: EnumDataType(typeof(PairingCategory), ErrorMessage = "La categoría no es válida.")] PairingCategory Category
);