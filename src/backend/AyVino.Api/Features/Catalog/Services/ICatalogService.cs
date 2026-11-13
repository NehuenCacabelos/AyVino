using AyVino.Api.Features.Catalog.DTOs;

namespace AyVino.Api.Features.Catalog.Services;

public interface ICatalogService
{
    Task<CatalogFiltersResponseDto> GetFiltersAsync(CancellationToken ct = default);
    Task<SearchSuggestionsResponseDto> GetSuggestionsAsync(string? q, CancellationToken ct = default);
}
