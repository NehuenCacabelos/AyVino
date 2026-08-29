namespace AyVino.Api.Features.Locations.DTOs;

public record CreateLocationRequestDto(
    string Country,
    string? State = null,
    string? City = null
);