namespace AyVino.Api.Features.Catalog.DTOs;

public record CatalogFiltersResponseDto(
    IReadOnlyList<CatalogFilterItemDto> Grapes,
    IReadOnlyList<CatalogFilterItemDto> Provinces,
    IReadOnlyList<CatalogFilterItemDto> Wineries);
