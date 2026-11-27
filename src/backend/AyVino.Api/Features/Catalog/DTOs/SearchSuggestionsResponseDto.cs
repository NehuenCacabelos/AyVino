namespace AyVino.Api.Features.Catalog.DTOs;

public record SearchSuggestionsResponseDto(
    IReadOnlyList<WineSuggestionDto> Wines,
    IReadOnlyList<WinerySuggestionDto> Wineries,
    IReadOnlyList<CatalogFilterItemDto> Grapes,
    IReadOnlyList<CatalogFilterItemDto> Regions);
