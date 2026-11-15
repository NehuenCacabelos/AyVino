using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Cellars.DTOs;

public record QuickAddCellarWineRequestDto(
    [property: Required(ErrorMessage = "El nombre del vino es obligatorio."),
               StringLength(150, ErrorMessage = "El nombre del vino no puede superar los 150 caracteres.")] string Name,
    [property: Required(ErrorMessage = "El nombre de la bodega es obligatorio."),
               StringLength(150, ErrorMessage = "El nombre de la bodega no puede superar los 150 caracteres.")] string WineryName,
    [property: Required(ErrorMessage = "El tipo de vino es obligatorio."),
               StringLength(30, ErrorMessage = "El tipo de vino no puede superar los 30 caracteres.")] string WineType,
    [property: Range(1800, 2100, ErrorMessage = "El año de la cosecha debe estar entre 1800 y 2100.")] int? Year = null,
    [property: Range(1, 999, ErrorMessage = "La cantidad debe estar entre 1 y 999.")] int Quantity = 1,
    [property: StringLength(100, ErrorMessage = "La ubicación no puede superar los 100 caracteres.")] string? Location = null,
    [property: StringLength(500, ErrorMessage = "Las notas no pueden superar los 500 caracteres.")] string? Notes = null,
    [property: Range(1, int.MaxValue, ErrorMessage = "El id de vino coincidente debe ser mayor a 0.")] int? MatchedWineId = null);

