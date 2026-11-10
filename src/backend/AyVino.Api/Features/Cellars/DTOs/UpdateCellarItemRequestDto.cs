using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Cellars.DTOs;

// PUT reemplaza todo: si PurchaseDate o Notes no vienen, quedan en null.
public record UpdateCellarItemRequestDto(
    [property: Range(1, 999, ErrorMessage = "La cantidad debe estar entre 1 y 999.")] int Quantity,
    DateOnly? PurchaseDate = null,
    [property: StringLength(500, ErrorMessage = "Las notas no pueden superar los 500 caracteres.")] string? Notes = null);