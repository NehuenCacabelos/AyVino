using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Wines.DTOs;

public record ClaimWinesRequestDto(
    [property: Required(ErrorMessage = "La lista de vinos es obligatoria."),
               MinLength(1, ErrorMessage = "Debe indicar al menos un vino.")] List<int> WineIds);