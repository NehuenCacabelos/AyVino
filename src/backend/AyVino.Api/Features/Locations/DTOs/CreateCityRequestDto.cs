using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Locations.DTOs;

public record CreateCityRequestDto(
    [property: Required(ErrorMessage = "El nombre de la ciudad es obligatorio."),
               StringLength(100, ErrorMessage = "El nombre de la ciudad no puede superar los 100 caracteres.")] string Name,
    [property: Range(1, int.MaxValue, ErrorMessage = "El id de la provincia debe ser mayor a 0.")] int StateId);