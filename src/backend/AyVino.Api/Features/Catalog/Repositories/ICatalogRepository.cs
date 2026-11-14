using AyVino.Api.Features.Catalog.DTOs;

namespace AyVino.Api.Features.Catalog.Repositories;

public interface ICatalogRepository
{
    Task<CatalogFiltersResponseDto> GetFiltersAsync(CancellationToken ct = default);

    Task<IReadOnlyList<WineSuggestionDto>> GetWineSuggestionsAsync(string searchKey, CancellationToken ct = default)
        => GetWineSuggestionsAsync(searchKey, null, null, null, ct);

    Task<IReadOnlyList<WineSuggestionDto>> GetWineSuggestionsAsync(
        string searchKey,
        int? grapeId,
        int? stateId,
        int? wineryId,
        CancellationToken ct = default);

    Task<IReadOnlyList<WinerySuggestionDto>> GetWinerySuggestionsAsync(string searchKey, CancellationToken ct = default)
        => GetWinerySuggestionsAsync(searchKey, null, null, ct);

    Task<IReadOnlyList<WinerySuggestionDto>> GetWinerySuggestionsAsync(
        string searchKey,
        int? grapeId,
        int? stateId,
        CancellationToken ct = default);

    Task<IReadOnlyList<CatalogFilterItemDto>> GetAvailableGrapesAsync(
        int? wineryId = null,
        int? stateId = null,
        CancellationToken ct = default);

    Task<IReadOnlyList<CatalogFilterItemDto>> GetAvailableProvincesAsync(
        int? wineryId = null,
        int? grapeId = null,
        CancellationToken ct = default);
}
