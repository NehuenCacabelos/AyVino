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

    public async Task<SearchSuggestionsResponseDto> GetSuggestionsAsync(string? q, CancellationToken ct = default)
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

        var winesTask = catalogRepository.GetWineSuggestionsAsync(searchKey, ct);
        var wineriesTask = catalogRepository.GetWinerySuggestionsAsync(searchKey, ct);
        var filtersTask = GetFiltersAsync(ct);

        await Task.WhenAll(winesTask, wineriesTask, filtersTask);

        var wines = await winesTask;
        var wineries = await wineriesTask;
        var filters = await filtersTask;

        var matchedGrapes = FilterAndRankInMemory(filters.Grapes, searchKey);
        var matchedRegions = FilterAndRankInMemory(filters.Provinces, searchKey);

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
