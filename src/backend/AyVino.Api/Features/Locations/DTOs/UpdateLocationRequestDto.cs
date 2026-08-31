namespace AyVino.Api.Features.Locations.DTOs;

public record UpdateLocationRequestDto(
    string Country,
    string? State,
    string? City
);