using System.ComponentModel.DataAnnotations;
using AyVino.Api.Features.Grapes.Enums;

namespace AyVino.Api.Features.Grapes.DTOs;

public record CreateGrapeRequestDto(
    [property: Required(ErrorMessage = "El nombre de la uva es obligatorio."),
               StringLength(100, ErrorMessage = "El nombre de la uva no puede superar los 100 caracteres.")] string Name,
    [property: EnumDataType(typeof(ColorType), ErrorMessage = "El tipo de color no es válido.")] ColorType ColorType,
    [property: EnumDataType(typeof(TypicalBody), ErrorMessage = "El cuerpo típico no es válido.")] TypicalBody? TypicalBody = null,
    [property: EnumDataType(typeof(TypicalTannins), ErrorMessage = "Los taninos típicos no son válidos.")] TypicalTannins? TypicalTannins = null,
    [property: EnumDataType(typeof(TypicalAcidity), ErrorMessage = "La acidez típica no es válida.")] TypicalAcidity? TypicalAcidity = null,
    [property: StringLength(1000, ErrorMessage = "La descripción no puede superar los 1000 caracteres.")] string? Description = null
);