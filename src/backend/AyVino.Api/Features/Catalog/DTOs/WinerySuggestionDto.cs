namespace AyVino.Api.Features.Catalog.DTOs;

public record WinerySuggestionDto(
    int Id,
    string Name,
    Guid? LogoImageId,
    string? Location);
