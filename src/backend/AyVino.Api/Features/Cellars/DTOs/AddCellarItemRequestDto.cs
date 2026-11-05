using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Cellars.DTOs;

public record AddCellarItemRequestDto(
    [property: Range(1, int.MaxValue, ErrorMessage = "El id de la cosecha debe ser mayor a 0.")] int WineVintageId,
    [property: Range(1, 999, ErrorMessage = "La cantidad debe estar entre 1 y 999.")] int Quantity,
    DateOnly? PurchaseDate = null,
    [property: StringLength(500, ErrorMessage = "Las notas no pueden superar los 500 caracteres.")] string? Notes = null);