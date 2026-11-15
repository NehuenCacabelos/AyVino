using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Locations.DTOs;

public record CreateLocationRequestDto(
    [property: Range(1, int.MaxValue, ErrorMessage = "El id de la ciudad debe ser mayor a 0.")] int CityId);