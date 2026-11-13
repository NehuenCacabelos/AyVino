namespace AyVino.Api.Features.Catalog.DTOs;

public record WineSuggestionDto(
    int Id,
    string Name,
    string? WineryName,
    int? Vintage,
    Guid? ImageId);
