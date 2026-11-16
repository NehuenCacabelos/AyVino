namespace AyVino.Api.Features.Sensory.DTOs;

public record SensoryAxisDto(string Key, decimal? Value, string Source, decimal? CalculatedValue);

public record VintageSensoryDto(IReadOnlyList<SensoryAxisDto> Axes);

public record UpdateVintageSensoryRequestDto(
    decimal? Body,
    decimal? Tannins,
    decimal? Acidity,
    decimal? Fruit,
    decimal? Oak,
    decimal? Persistence
);

public record SensoryPreviewGrapeDto(int GrapeId, decimal? Percentage);

public record SensoryPreviewRequestDto(List<SensoryPreviewGrapeDto>? Grapes);
