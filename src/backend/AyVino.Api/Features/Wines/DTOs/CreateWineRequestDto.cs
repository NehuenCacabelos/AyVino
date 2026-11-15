using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Wines.DTOs;

public record CreateWineRequestDto(
    [property: Required(ErrorMessage = "El nombre del vino es obligatorio."),
               StringLength(150, ErrorMessage = "El nombre del vino no puede superar los 150 caracteres.")] string Name,
    [property: Required(ErrorMessage = "El tipo de vino es obligatorio."),
               StringLength(30, ErrorMessage = "El tipo de vino no puede superar los 30 caracteres.")] string WineType,
    [property: Required(ErrorMessage = "La primera cosecha es obligatoria.")] CreateWineVintageRequestDto FirstVintage,
    [property: Range(1, int.MaxValue, ErrorMessage = "El id de la bodega debe ser mayor a 0.")] int? WineryId = null,
    [property: StringLength(150, ErrorMessage = "El nombre de la bodega no puede superar los 150 caracteres.")] string? WineryNameText = null,
    [property: StringLength(1000, ErrorMessage = "La descripción no puede superar los 1000 caracteres.")] string? Description = null,
    [property: Range(1, int.MaxValue, ErrorMessage = "El id de la ubicación debe ser mayor a 0.")] int? LocationId = null);