namespace AyVino.Api.Features.Wines.DTOs;

public record WineGrapeRequestDto(int GrapeId, decimal? Percentage = null);