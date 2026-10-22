namespace AyVino.Api.Features.Cellars.DTOs;

public record CellarResponseDto(
    int Id,
    string Name,
    int VintageCount,
    int BottleCount,
    DateTime CreatedAt);