using System.ComponentModel.DataAnnotations;
using AyVino.Api.Features.Reviews.Validation;

namespace AyVino.Api.Features.Cellars.DTOs;

public record UncorkCellarItemRequestDto(
    [property: Range(1.0, 5.0, ErrorMessage = "El rating debe estar entre 1 y 5.")]
    [property: ValidRating] decimal? Rating = null,
    [property: StringLength(1000, ErrorMessage = "El comentario no puede superar los 1000 caracteres.")] string? Comment = null,
    DateTime? UncorkedAt = null);

