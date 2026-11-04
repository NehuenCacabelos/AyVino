using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Catalog.DTOs;
using AyVino.Api.Features.Catalog.Models;
using AyVino.Api.Features.Catalog.Repositories;
using AyVino.Api.Features.Catalog.Services;
using AyVino.Api.Features.Wines.Enums;
using NSubstitute;

namespace AyVino.UnitTests;

public class CatalogServiceTests
{
    private readonly ICatalogRepository _repo = Substitute.For<ICatalogRepository>();
    private readonly CatalogService _service;

    public CatalogServiceTests()
    {
        _service = new CatalogService(_repo);
    }

    [Fact]
    public async Task GetShowcaseAsync_InvalidPageNumber_ThrowsValidationException()
    {
        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.GetShowcaseAsync(null, null, null, null, pageNumber: 0, pageSize: 6));
    }

    [Fact]
    public async Task GetShowcaseAsync_InvalidPageSize_ThrowsValidationException()
    {
        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.GetShowcaseAsync(null, null, null, null, pageNumber: 1, pageSize: 100));
    }

    [Fact]
    public async Task GetShowcaseAsync_InvalidWineType_ThrowsValidationException()
    {
        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.GetShowcaseAsync(null, "NotAType", null, null));
    }

    [Fact]
    public async Task GetShowcaseAsync_EmptyWineries_ReturnsEmptyResult()
    {
        _repo.GetShowcaseWineriesPagedAsync(null, null, null, null, 1, 6, Arg.Any<CancellationToken>())
            .Returns((0, Array.Empty<ShowcaseWineryRow>()));

        var result = await _service.GetShowcaseAsync(null, null, null, null, 1, 6);

        Assert.NotNull(result);
        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalCount);
        Assert.Equal(0, result.TotalPages);
        Assert.False(result.HasNextPage);
        await _repo.DidNotReceive().GetShowcaseWinesAsync(Arg.Any<IEnumerable<string>>(), Arg.Any<string>(), Arg.Any<WineType?>(), Arg.Any<int?>(), Arg.Any<int?>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetShowcaseAsync_GroupsWinesUnderWineries_WithPaginationAndCalculatedRatings()
    {
        var wineryRows = new List<ShowcaseWineryRow>
        {
            new("W_1", 1, "Bodega Catena Zapata", "Mendoza, Luján de Cuyo", Guid.NewGuid(), true, 2),
            new("T_don domingo", null, "Don Domingo", "San Juan", null, false, 1)
        };

        _repo.GetShowcaseWineriesPagedAsync("zapata", WineType.Red, 3, 1, 1, 6, Arg.Any<CancellationToken>())
            .Returns((10, wineryRows));

        var wineRows = new List<ShowcaseWineRow>
        {
            new("W_1", 101, 1, null, "Catena Malbec", "Excelente", (int)WineType.Red, 1, (int)SourceType.Official, null, 48, 10, Guid.NewGuid(), 2021),
            new("W_1", 102, 1, null, "Catena Cabernet", "Clásico", (int)WineType.Red, 1, (int)SourceType.Official, null, 12, 3, null, 2020),
            new("T_don domingo", 201, null, "Don Domingo", "Don Domingo Tinto", null, (int)WineType.Red, null, (int)SourceType.Community, null, 0, 0, null, null)
        };

        _repo.GetShowcaseWinesAsync(Arg.Is<IEnumerable<string>>(keys => keys.Contains("W_1") && keys.Contains("T_don domingo")),
            "zapata", WineType.Red, 3, 1, 8, Arg.Any<CancellationToken>())
            .Returns(wineRows);

        var result = await _service.GetShowcaseAsync("zapata", "Red", 3, 1, 1, 6, 8);

        Assert.NotNull(result);
        Assert.Equal(10, result.TotalCount);
        Assert.Equal(2, result.TotalPages);
        Assert.True(result.HasNextPage);
        Assert.Equal(2, result.Items.Count);

        var catena = result.Items[0];
        Assert.Equal(1, catena.WineryId);
        Assert.Equal("Bodega Catena Zapata", catena.WineryName);
        Assert.True(catena.IsVerified);
        Assert.Equal(2, catena.Wines.Count);

        var wine1 = catena.Wines[0];
        Assert.Equal(101, wine1.Id);
        Assert.Equal(4.8m, wine1.AverageRating); // 48 / 10 >= 5 reviews

        var wine2 = catena.Wines[1];
        Assert.Equal(102, wine2.Id);
        Assert.Null(wine2.AverageRating); // 3 reviews < 5 threshold

        var commWinery = result.Items[1];
        Assert.Null(commWinery.WineryId);
        Assert.Equal("Don Domingo", commWinery.WineryName);
        Assert.False(commWinery.IsVerified);
        Assert.Single(commWinery.Wines);
    }

    [Fact]
    public async Task GetFiltersAsync_DelegatesToRepository()
    {
        var expected = new CatalogFiltersResponseDto(
            Varietals: [new CatalogFilterOptionDto(1, "Malbec", 5)],
            Regions: [new CatalogFilterOptionDto(2, "Mendoza", 8)],
            Wineries: [new CatalogFilterOptionDto(10, "Catena Zapata", 3)]);

        _repo.GetCatalogFiltersAsync(Arg.Any<CancellationToken>()).Returns(expected);

        var result = await _service.GetFiltersAsync();

        Assert.Same(expected, result);
        Assert.Single(result.Varietals);
        Assert.Single(result.Regions);
        Assert.Single(result.Wineries);
    }
}
