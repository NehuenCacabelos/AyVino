using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.WineryCatalog.Models;
using AyVino.Api.Features.WineryCatalog.Repositories;
using AyVino.Api.Features.WineryCatalog.Services;
using AyVino.Api.Features.Wines.Enums;
using NSubstitute;
using Xunit;

namespace AyVino.UnitTests;

public class WineryCatalogTests
{
    private readonly IWineryCatalogRepository _repository = Substitute.For<IWineryCatalogRepository>();
    private readonly WineryCatalogService _service;

    public WineryCatalogTests()
    {
        _service = new WineryCatalogService(_repository);
    }

    [Fact]
    public async Task GetMyCatalogAsync_UserWithoutWinery_ThrowsNotFoundException()
    {
        // Arrange
        _repository.GetWineryByUserIdAsync(42, Arg.Any<CancellationToken>())
            .Returns((WineryCatalogOwnerWinery?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _service.GetMyCatalogAsync(42));
    }

    [Fact]
    public async Task GetMyCatalogAsync_WineryWithoutWines_ReturnsEmptyCatalogWithTotals()
    {
        // Arrange
        var winery = new WineryCatalogOwnerWinery(10, WineryStatus.Approved);
        _repository.GetWineryByUserIdAsync(5, Arg.Any<CancellationToken>()).Returns(winery);

        var totalsRow = new WineryCatalogTotalsRow(
            TotalLabels: 0,
            TotalVintages: 0,
            VintagesApproved: 0,
            VintagesPending: 0,
            VintagesRejected: 0);
        _repository.GetTotalsByWineryIdAsync(10, Arg.Any<CancellationToken>()).Returns(totalsRow);

        _repository.GetWinesByWineryIdAsync(10, 201, Arg.Any<CancellationToken>())
            .Returns(Array.Empty<WineryCatalogWineRow>());

        // Act
        var result = await _service.GetMyCatalogAsync(5);

        // Assert
        Assert.Equal(10, result.WineryId);
        Assert.Equal("Approved", result.WineryStatus);
        Assert.False(result.HasMore);
        Assert.Empty(result.Wines);
        Assert.Equal(0, result.Totals.Labels);
        Assert.Equal(0, result.Totals.Vintages);
        Assert.Equal(0, result.Totals.VintagesApproved);
        Assert.Equal(0, result.Totals.VintagesPending);
        Assert.Equal(0, result.Totals.VintagesRejected);
    }

    [Fact]
    public async Task GetMyCatalogAsync_WineryWithWines_ReturnsHierarchicalCatalogOrdered()
    {
        // Arrange
        var winery = new WineryCatalogOwnerWinery(12, WineryStatus.Pending);
        _repository.GetWineryByUserIdAsync(9, Arg.Any<CancellationToken>()).Returns(winery);

        var totalsRow = new WineryCatalogTotalsRow(
            TotalLabels: 2,
            TotalVintages: 3,
            VintagesApproved: 1,
            VintagesPending: 1,
            VintagesRejected: 1);
        _repository.GetTotalsByWineryIdAsync(12, Arg.Any<CancellationToken>()).Returns(totalsRow);

        var wines = new List<WineryCatalogWineRow>
        {
            new(101, "Altos de Mendoza Malbec", "Gran reserva", WineType.Red, SourceType.Official, 24, 5), // avg: 4.8
            new(102, "Valle Blanco Torrontes", null, WineType.White, SourceType.Official, 8, 2)            // avg: null (< 5 reviews)
        };
        _repository.GetWinesByWineryIdAsync(12, 201, Arg.Any<CancellationToken>()).Returns(wines);

        var vintages = new List<WineryCatalogVintageRow>
        {
            new(201, 101, 2019, 14.5m, 16, "5 años", "https://img/v1.png", ApprovalStatus.Approved, DateTime.UtcNow, 25, 5),
            new(202, 101, 2022, 14.0m, 16, null, null, ApprovalStatus.Pending, DateTime.UtcNow, 0, 0),
            new(203, 102, null, 13.0m, 10, null, null, ApprovalStatus.Rejected, DateTime.UtcNow, 0, 0)
        };
        _repository.GetVintagesByWineIdsAsync(Arg.Is<IEnumerable<int>>(ids => ids.Contains(101) && ids.Contains(102)), Arg.Any<CancellationToken>())
            .Returns(vintages);

        var grapes = new List<WineryCatalogGrapeRow>
        {
            new(201, 1, "Malbec", 85m),
            new(201, 2, "Cabernet Sauvignon", 15m),
            new(202, 1, "Malbec", 100m),
            new(203, 3, "Torrontes", null)
        };
        _repository.GetGrapesByVintageIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>())
            .Returns(grapes);

        // Act
        var result = await _service.GetMyCatalogAsync(9);

        // Assert
        Assert.Equal(12, result.WineryId);
        Assert.Equal("Pending", result.WineryStatus);
        Assert.False(result.HasMore);
        Assert.Equal(2, result.Totals.Labels);
        Assert.Equal(3, result.Totals.Vintages);
        Assert.Equal(1, result.Totals.VintagesApproved);
        Assert.Equal(1, result.Totals.VintagesPending);
        Assert.Equal(1, result.Totals.VintagesRejected);

        Assert.Equal(2, result.Wines.Count);

        // Primer vino
        var wine1 = result.Wines[0];
        Assert.Equal(101, wine1.Id);
        Assert.Equal("Altos de Mendoza Malbec", wine1.Name);
        Assert.Equal(4.8m, wine1.AverageRating);
        Assert.Equal(2, wine1.Vintages.Count);

        // Cosechas ordenadas por año descendente (2022 primero, 2019 después)
        Assert.Equal(202, wine1.Vintages[0].Id);
        Assert.Equal(2022, wine1.Vintages[0].Year);
        Assert.Equal("Pending", wine1.Vintages[0].ApprovalStatus);

        Assert.Equal(201, wine1.Vintages[1].Id);
        Assert.Equal(2019, wine1.Vintages[1].Year);
        Assert.Equal("Approved", wine1.Vintages[1].ApprovalStatus);
        Assert.Equal(5.0m, wine1.Vintages[1].AverageRating);

        // Uvas ordenadas por porcentaje descendente (85% Malbec primero, 15% Cabernet segundo)
        Assert.Equal(2, wine1.Vintages[1].Grapes.Count);
        Assert.Equal("Malbec", wine1.Vintages[1].Grapes[0].GrapeName);
        Assert.Equal(85m, wine1.Vintages[1].Grapes[0].Percentage);
        Assert.Equal("Cabernet Sauvignon", wine1.Vintages[1].Grapes[1].GrapeName);
        Assert.Equal(15m, wine1.Vintages[1].Grapes[1].Percentage);

        // Segundo vino (sin año al final)
        var wine2 = result.Wines[1];
        Assert.Equal(102, wine2.Id);
        Assert.Null(wine2.AverageRating);
        Assert.Single(wine2.Vintages);
        Assert.Null(wine2.Vintages[0].Year);
        Assert.Equal("Rejected", wine2.Vintages[0].ApprovalStatus);
    }

    [Fact]
    public async Task GetMyCatalogAsync_WhenMoreThan200Wines_TruncatesTo200AndSetsHasMoreTrue()
    {
        // Arrange
        var winery = new WineryCatalogOwnerWinery(30, WineryStatus.Approved);
        _repository.GetWineryByUserIdAsync(15, Arg.Any<CancellationToken>()).Returns(winery);

        var totalsRow = new WineryCatalogTotalsRow(350, 400, 300, 80, 20);
        _repository.GetTotalsByWineryIdAsync(30, Arg.Any<CancellationToken>()).Returns(totalsRow);

        // 201 filas retornadas por el repo
        var wineRows = Enumerable.Range(1, 201)
            .Select(i => new WineryCatalogWineRow(i, $"Vino #{i}", null, WineType.Red, SourceType.Official, 0, 0))
            .ToList();
        _repository.GetWinesByWineryIdAsync(30, 201, Arg.Any<CancellationToken>()).Returns(wineRows);

        _repository.GetVintagesByWineIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>())
            .Returns(Array.Empty<WineryCatalogVintageRow>());
        _repository.GetGrapesByVintageIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>())
            .Returns(Array.Empty<WineryCatalogGrapeRow>());

        // Act
        var result = await _service.GetMyCatalogAsync(15);

        // Assert
        Assert.True(result.HasMore);
        Assert.Equal(200, result.Wines.Count);
        Assert.Equal(350, result.Totals.Labels);
        Assert.Equal(400, result.Totals.Vintages);
    }
}
