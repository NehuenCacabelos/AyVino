using AyVino.Api.Features.Catalog.DTOs;
using AyVino.Api.Features.Catalog.Repositories;
using AyVino.Api.Features.Wines;
using Microsoft.Extensions.Caching.Memory;

namespace AyVino.Api.Features.Catalog.Services;

public class CatalogService(
    ICatalogRepository catalogRepository,
    IMemoryCache cache) : ICatalogService
{
    private const string FiltersCacheKey = "catalog_filters";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public async Task<CatalogFiltersResponseDto> GetFiltersAsync(CancellationToken ct = default)
    {
        if (cache.TryGetValue(FiltersCacheKey, out CatalogFiltersResponseDto? cached) && cached is not null)
        {
            return cached;
        }

        var filters = await catalogRepository.GetFiltersAsync(ct);
        cache.Set(FiltersCacheKey, filters, CacheDuration);
        return filters;
    }

    public async Task<SearchSuggestionsResponseDto> GetSuggestionsAsync(
        string? q,
        int? grapeId = null,
        int? stateId = null,
        int? wineryId = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return new SearchSuggestionsResponseDto([], [], [], []);
        }

        var searchKey = WineLabelNormalizer.ToSearchKey(q);
        if (searchKey.Length < 2)
        {
            return new SearchSuggestionsResponseDto([], [], [], []);
        }

        var hasWineFilters = grapeId.HasValue || stateId.HasValue || wineryId.HasValue;
        var winesTask = hasWineFilters
            ? catalogRepository.GetWineSuggestionsAsync(searchKey, grapeId, stateId, wineryId, ct)
            : catalogRepository.GetWineSuggestionsAsync(searchKey, ct);

        Task<IReadOnlyList<WinerySuggestionDto>> wineriesTask;
        if (wineryId.HasValue)
        {
            wineriesTask = Task.FromResult<IReadOnlyList<WinerySuggestionDto>>([]);
        }
        else if (grapeId.HasValue || stateId.HasValue)
        {
            wineriesTask = catalogRepository.GetWinerySuggestionsAsync(searchKey, grapeId, stateId, ct);
        }
        else
        {
            wineriesTask = catalogRepository.GetWinerySuggestionsAsync(searchKey, ct);
        }

        Task<IReadOnlyList<CatalogFilterItemDto>> grapesCandidateTask;
        if (grapeId.HasValue)
        {
            grapesCandidateTask = Task.FromResult<IReadOnlyList<CatalogFilterItemDto>>([]);
        }
        else if (wineryId.HasValue || stateId.HasValue)
        {
            grapesCandidateTask = catalogRepository.GetAvailableGrapesAsync(wineryId, stateId, ct);
        }
        else
        {
            grapesCandidateTask = GetFiltersAsync(ct).ContinueWith(t => (IReadOnlyList<CatalogFilterItemDto>)t.Result.Grapes, ct);
        }

        Task<IReadOnlyList<CatalogFilterItemDto>> regionsCandidateTask;
        if (stateId.HasValue)
        {
            regionsCandidateTask = Task.FromResult<IReadOnlyList<CatalogFilterItemDto>>([]);
        }
        else if (wineryId.HasValue || grapeId.HasValue)
        {
            regionsCandidateTask = catalogRepository.GetAvailableProvincesAsync(wineryId, grapeId, ct);
        }
        else
        {
            regionsCandidateTask = GetFiltersAsync(ct).ContinueWith(t => (IReadOnlyList<CatalogFilterItemDto>)t.Result.Provinces, ct);
        }

        await Task.WhenAll(winesTask, wineriesTask, grapesCandidateTask, regionsCandidateTask);

        var wines = await winesTask;
        var wineries = await wineriesTask;
        var availableGrapes = await grapesCandidateTask;
        var availableRegions = await regionsCandidateTask;

        var matchedGrapes = grapeId.HasValue ? [] : FilterAndRankInMemory(availableGrapes, searchKey);
        var matchedRegions = stateId.HasValue ? [] : FilterAndRankInMemory(availableRegions, searchKey);

        return new SearchSuggestionsResponseDto(wines, wineries, matchedGrapes, matchedRegions);
    }

    private static IReadOnlyList<CatalogFilterItemDto> FilterAndRankInMemory(
        IEnumerable<CatalogFilterItemDto> items,
        string searchKey)
    {
        var matched = new List<(CatalogFilterItemDto Item, int Score, double Similarity)>();

        foreach (var item in items)
        {
            var itemKey = WineLabelNormalizer.ToSearchKey(item.Name);
            if (string.IsNullOrEmpty(itemKey))
            {
                continue;
            }

            var sim = WineLabelNormalizer.TrigramSimilarity(itemKey, searchKey);
            var contains = itemKey.Contains(searchKey);

            if (contains || sim > 0.3)
            {
                int score;
                if (itemKey == searchKey)
                {
                    score = 4;
                }
                else if (itemKey.StartsWith(searchKey))
                {
                    score = 3;
                }
                else if (contains)
                {
                    score = 2;
                }
                else
                {
                    score = 1;
                }

                matched.Add((item, score, sim));
            }
        }

        return matched
            .OrderByDescending(m => m.Score)
            .ThenByDescending(m => m.Similarity)
            .ThenBy(m => m.Item.Name)
            .Take(3)
            .Select(m => m.Item)
            .ToList();
    }
}
