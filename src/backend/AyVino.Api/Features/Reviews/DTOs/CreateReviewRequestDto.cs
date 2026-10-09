using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Reviews.DTOs;

public record CreateReviewRequestDto(
    [property: Range(1, int.MaxValue, ErrorMessage = "El id de la cosecha debe ser mayor a 0.")] int WineVintageId,
    [property: Range(1, 5, ErrorMessage = "El rating debe estar entre 1 y 5.")] int Rating,
    [property: StringLength(1000, ErrorMessage = "El comentario no puede superar los 1000 caracteres.")] string? Comment);