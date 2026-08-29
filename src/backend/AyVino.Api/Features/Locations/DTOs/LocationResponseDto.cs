namespace AyVino.Api.Features.Locations.DTOs;

public record LocationResponseDto(
    int Id,
    string Country,
    string? State,
    string? City
);