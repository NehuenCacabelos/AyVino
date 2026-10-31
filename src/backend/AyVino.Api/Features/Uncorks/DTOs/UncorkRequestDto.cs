using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Uncorks.DTOs;

public record UncorkRequestDto(
    [property: Range(1, int.MaxValue, ErrorMessage = "El ID de la cosecha debe ser mayor a 0.")]
    int WineVintageId,
    [property: Range(1, int.MaxValue, ErrorMessage = "El ID de la cava debe ser mayor a 0.")]
    int? CellarId = null,
    [property: Range(1, 5, ErrorMessage = "El puntaje debe estar entre 1 y 5.")]
    int? Rating = null,
    [property: StringLength(1000, ErrorMessage = "El comentario no puede superar los 1000 caracteres.")]
    string? Comment = null);
