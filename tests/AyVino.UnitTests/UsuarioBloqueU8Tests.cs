using AyVino.Api.Features.Catalog.DTOs;
using AyVino.Api.Features.Catalog.Repositories;
using AyVino.Api.Features.Catalog.Services;
using Microsoft.Extensions.Caching.Memory;
using NSubstitute;

namespace AyVino.UnitTests;

public class UsuarioBloqueU8Tests
{
    private readonly ICatalogRepository _repository = Substitute.For<ICatalogRepository>();
    private readonly IMemoryCache _cache = new MemoryCache(new MemoryCacheOptions());

    private CatalogService CreateService() => new(_repository, _cache);

    private readonly CatalogFiltersResponseDto _mockFilters = new(
        Grapes:
        [
            new CatalogFilterItemDto(1, "Malbec", 20),
            new CatalogFilterItemDto(2, "Cabernet Sauvignon", 15),
            new CatalogFilterItemDto(3, "Torrontés", 8),
            new CatalogFilterItemDto(4, "Bonarda", 5)
        ],
        Provinces:
        [
            new CatalogFilterItemDto(10, "Mendoza", 30),
            new CatalogFilterItemDto(20, "Salta", 10),
            new CatalogFilterItemDto(30, "San Juan", 5)
        ],
        Wineries:
        [
            new CatalogFilterItemDto(100, "Catena Zapata", 12),
            new CatalogFilterItemDto(200, "Rutini Wines", 10),
            new CatalogFilterItemDto(300, "Zuccardi", 8)
        ]
    );

    [Fact]
    public async Task GetSuggestionsAsync_WithoutFilters_ReturnsAllGroupsNormally()
    {
        var service = CreateService();
        _repository.GetFiltersAsync(Arg.Any<CancellationToken>())
            .Returns(_mockFilters);

        _repository.GetWineSuggestionsAsync("malbec", Arg.Any<CancellationToken>())
            .Returns([new WineSuggestionDto(1, "Catena Zapata Malbec", "Catena Zapata", 2021, null)]);

        _repository.GetWinerySuggestionsAsync("malbec", Arg.Any<CancellationToken>())
            .Returns([new WinerySuggestionDto(100, "Catena Zapata", null, "Mendoza")]);

        var result = await service.GetSuggestionsAsync("malbec");

        Assert.Single(result.Wines);
        Assert.Single(result.Wineries);
        Assert.NotEmpty(result.Grapes);
        Assert.Contains(result.Grapes, g => g.Name == "Malbec");
    }

    [Fact]
    public async Task GetSuggestionsAsync_WithWineryId_OmitsWineriesGroupAndFiltersGrapesAndRegions()
    {
        var service = CreateService();

        _repository.GetWineSuggestionsAsync("malbec", null, null, 100, Arg.Any<CancellationToken>())
            .Returns([new WineSuggestionDto(1, "Catena Zapata Malbec", "Catena Zapata", 2021, null)]);

        _repository.GetAvailableGrapesAsync(100, null, Arg.Any<CancellationToken>())
            .Returns([new CatalogFilterItemDto(1, "Malbec", 5)]);

        _repository.GetAvailableProvincesAsync(100, null, Arg.Any<CancellationToken>())
            .Returns([new CatalogFilterItemDto(10, "Mendoza", 5)]);

        var result = await service.GetSuggestionsAsync("malbec", wineryId: 100);

        // Grupo wineries omitido
        Assert.Empty(result.Wineries);

        // Grupo wines consultado con wineryId 100
        await _repository.Received(1).GetWineSuggestionsAsync("malbec", null, null, 100, Arg.Any<CancellationToken>());
        Assert.Single(result.Wines);

        // Grapes consultadas con GetAvailableGrapesAsync para esa bodega
        await _repository.Received(1).GetAvailableGrapesAsync(100, null, Arg.Any<CancellationToken>());
        Assert.Single(result.Grapes);
        Assert.Equal("Malbec", result.Grapes[0].Name);
    }

    [Fact]
    public async Task GetSuggestionsAsync_WithGrapeId_OmitsGrapesGroupAndPassesFilterToWinesAndWineries()
    {
        var service = CreateService();

        _repository.GetWineSuggestionsAsync("catena", 1, null, null, Arg.Any<CancellationToken>())
            .Returns([new WineSuggestionDto(1, "Catena Zapata Malbec", "Catena Zapata", 2021, null)]);

        _repository.GetWinerySuggestionsAsync("catena", 1, null, Arg.Any<CancellationToken>())
            .Returns([new WinerySuggestionDto(100, "Catena Zapata", null, "Mendoza")]);

        _repository.GetAvailableProvincesAsync(null, 1, Arg.Any<CancellationToken>())
            .Returns([new CatalogFilterItemDto(10, "Mendoza", 10)]);

        var result = await service.GetSuggestionsAsync("catena", grapeId: 1);

        // Grupo grapes omitido
        Assert.Empty(result.Grapes);

        // Grupo wineries y wines reciben grapeId
        await _repository.Received(1).GetWineSuggestionsAsync("catena", 1, null, null, Arg.Any<CancellationToken>());
        await _repository.Received(1).GetWinerySuggestionsAsync("catena", 1, null, Arg.Any<CancellationToken>());
        Assert.Single(result.Wines);
        Assert.Single(result.Wineries);

        // Regions consultadas con grapeId
        await _repository.Received(1).GetAvailableProvincesAsync(null, 1, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetSuggestionsAsync_WithStateId_OmitsRegionsGroupAndPassesFilter()
    {
        var service = CreateService();

        _repository.GetWineSuggestionsAsync("salta", null, 20, null, Arg.Any<CancellationToken>())
            .Returns([]);

        _repository.GetWinerySuggestionsAsync("salta", null, 20, Arg.Any<CancellationToken>())
            .Returns([]);

        _repository.GetAvailableGrapesAsync(null, 20, Arg.Any<CancellationToken>())
            .Returns([new CatalogFilterItemDto(3, "Torrontés", 8)]);

        var result = await service.GetSuggestionsAsync("salta", stateId: 20);

        // Grupo regions omitido
        Assert.Empty(result.Regions);

        // Grapes consultadas con stateId 20
        await _repository.Received(1).GetAvailableGrapesAsync(null, 20, Arg.Any<CancellationToken>());
        await _repository.Received(1).GetWineSuggestionsAsync("salta", null, 20, null, Arg.Any<CancellationToken>());
        await _repository.Received(1).GetWinerySuggestionsAsync("salta", null, 20, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetSuggestionsAsync_WithCombinedFilters_OmitsMultipleGroupsAndCombinesFilters()
    {
        var service = CreateService();

        _repository.GetWineSuggestionsAsync("men", 1, null, 100, Arg.Any<CancellationToken>())
            .Returns([new WineSuggestionDto(1, "Mendoza Gran Reserva", "Catena Zapata", 2021, null)]);

        _repository.GetAvailableProvincesAsync(100, 1, Arg.Any<CancellationToken>())
            .Returns([new CatalogFilterItemDto(10, "Mendoza", 5)]);

        var result = await service.GetSuggestionsAsync("men", grapeId: 1, wineryId: 100);

        // Grapes y Wineries omitidos
        Assert.Empty(result.Grapes);
        Assert.Empty(result.Wineries);

        // Wines consultados con ambos filtros
        await _repository.Received(1).GetWineSuggestionsAsync("men", 1, null, 100, Arg.Any<CancellationToken>());
        Assert.Single(result.Wines);

        // Provinces consultadas con ambos filtros
        await _repository.Received(1).GetAvailableProvincesAsync(100, 1, Arg.Any<CancellationToken>());
        Assert.Single(result.Regions);
        Assert.Equal("Mendoza", result.Regions[0].Name);
    }
}
