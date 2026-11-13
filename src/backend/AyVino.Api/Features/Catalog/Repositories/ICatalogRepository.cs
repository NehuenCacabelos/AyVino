using AyVino.Api.Features.Catalog.DTOs;

namespace AyVino.Api.Features.Catalog.Repositories;

public interface ICatalogRepository
{
    Task<CatalogFiltersResponseDto> GetFiltersAsync(CancellationToken ct = default);
    Task<IReadOnlyList<WineSuggestionDto>> GetWineSuggestionsAsync(string searchKey, CancellationToken ct = default);
    Task<IReadOnlyList<WinerySuggestionDto>> GetWinerySuggestionsAsync(string searchKey, CancellationToken ct = default);
}
