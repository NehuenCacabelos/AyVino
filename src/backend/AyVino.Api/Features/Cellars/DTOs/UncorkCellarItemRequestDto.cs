using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Cellars.DTOs;

public record UncorkCellarItemRequestDto(
    [property: Range(1, 5, ErrorMessage = "El rating debe estar entre 1 y 5.")] int? Rating = null,
    [property: StringLength(1000, ErrorMessage = "El comentario no puede superar los 1000 caracteres.")] string? Comment = null);
