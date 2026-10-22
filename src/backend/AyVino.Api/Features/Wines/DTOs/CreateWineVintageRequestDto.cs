using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Wines.DTOs;

public record CreateWineVintageRequestDto(
    [property: Range(1800, 2100, ErrorMessage = "El año de la cosecha debe estar entre 1800 y 2100.")] int? Year = null,
    [property: Range(0.0, 99.99, ErrorMessage = "El contenido de alcohol debe estar entre 0 y 99.99.")] decimal? AlcoholContent = null,
    [property: Range(0, 30, ErrorMessage = "La temperatura de servicio debe estar entre 0 y 30 °C.")] int? ServingTemperature = null,
    [property: StringLength(500, ErrorMessage = "El consejo de guarda no puede superar los 500 caracteres.")] string? AgingAdvice = null,
    [property: Url(ErrorMessage = "La imagen debe ser una URL válida."),
               StringLength(300, ErrorMessage = "La URL de la imagen no puede superar los 300 caracteres.")] string? ImageUrl = null,
    [property: MaxLength(20, ErrorMessage = "Una cosecha no puede tener más de 20 uvas.")] List<WineGrapeRequestDto>? Grapes = null);