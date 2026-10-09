using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Wineries.DTOs;

public record UpdateWineryRequestDto(
    [property: Required(ErrorMessage = "El nombre de la bodega es obligatorio."),
               StringLength(100, ErrorMessage = "El nombre de la bodega no puede superar los 100 caracteres.")] string Name,
    [property: Range(1, int.MaxValue, ErrorMessage = "El id de la ubicación debe ser mayor a 0.")] int LocationId,
    [property: StringLength(1000, ErrorMessage = "La descripción no puede superar los 1000 caracteres.")] string? Description = null,
    [property: Range(1000, 2100, ErrorMessage = "El año de fundación debe estar entre 1000 y 2100.")] int? FoundationYear = null,
    [property: Url(ErrorMessage = "El sitio web debe ser una URL válida."),
               StringLength(200, ErrorMessage = "El sitio web no puede superar los 200 caracteres.")] string? Website = null);