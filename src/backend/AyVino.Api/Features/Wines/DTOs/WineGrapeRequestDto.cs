using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Wines.DTOs;

public record WineGrapeRequestDto(
    [property: Range(1, int.MaxValue, ErrorMessage = "El id de la uva debe ser mayor a 0.")] int GrapeId,
    [property: Range(0.01, 100.0, ErrorMessage = "El porcentaje debe estar entre 0.01 y 100.")] decimal? Percentage = null);