using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.WineryCatalog.DTOs;
using AyVino.Api.Features.WineryCatalog.Models;
using AyVino.Api.Features.WineryCatalog.Repositories;
using AyVino.Api.Features.WineryCatalog.Services;
using AyVino.Api.Features.Wines.Enums;
using NSubstitute;
using Xunit;

namespace AyVino.UnitTests;

public class WineryPublicCatalogTests
{
    private readonly IWineryCatalogRepository _repository = Substitute.For<IWineryCatalogRepository>();
    private readonly WineryCatalogService _service;

    public WineryPublicCatalogTests()
    {
        _service = new WineryCatalogService(_repository);
    }

    private static WineryPublicProfileRow CreateWineryRow(int id = 1, WineryStatus status = WineryStatus.Approved, int? userId = 10)
    {
        return new WineryPublicProfileRow(
            Id: id,
            Name: "Bodega Test",
            Description: "Una bodega tradicional de Mendoza.",
            FoundationYear: 1950,
            Website: "https://bodegatest.com",
            UserId: userId,
            Status: status,
            RegisterDate: new DateTime(2025, 1, 1),
            Latitude: -33.123m,
            Longitude: -68.456m,
            LogoImageId: null,
            BannerImageId: null,
            StateName: "Mendoza",
            RegionName: "Luján de Cuyo");
    }

    [Fact]
    public async Task GetPublicProfileAsync_ApprovedWinery_AnonymousUser_ReturnsProfileWithIsPreviewFalse()
    {
        // Arrange
        var winery = CreateWineryRow(1, WineryStatus.Approved);
        _repository.GetWineryPublicProfileRowAsync(1, Arg.Any<CancellationToken>()).Returns(winery);
        _repository.GetFollowersCountAsync(1, Arg.Any<CancellationToken>()).Returns(15);
        _repository.GetPublicRatingsAndTotalsAsync(1, false, Arg.Any<CancellationToken>())
            .Returns(new WineryPublicRatingsAndTotalsRow(Labels: 4, Vintages: 8, RatingSum: 45, ReviewCount: 10));

        // Act
        var result = await _service.GetPublicProfileAsync(1, actor: null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("Bodega Test", result.Name);
        Assert.False(result.IsPreview);
        Assert.Null(result.IsFollowedByMe);
        Assert.Equal(15, result.FollowersCount);
        Assert.Equal(4, result.Totals.Labels);
        Assert.Equal(8, result.Totals.Vintages);
        Assert.Equal(4.5m, result.AverageRating);
        Assert.Equal(10, result.ReviewCount);
        Assert.NotNull(result.Location);
        Assert.Equal("Mendoza", result.Location!.StateName);
        Assert.Equal("Luján de Cuyo", result.Location!.RegionName);
        Assert.False(result.IsOwner);
    }

    [Fact]
    public async Task GetPublicProfileAsync_ApprovedWinery_WhenActorIsOwner_ReturnsIsOwnerTrueAndIsFollowedByMeFalse()
    {
        // Arrange
        var winery = CreateWineryRow(1, WineryStatus.Approved, userId: 10);
        _repository.GetWineryPublicProfileRowAsync(1, Arg.Any<CancellationToken>()).Returns(winery);
        _repository.GetFollowersCountAsync(1, Arg.Any<CancellationToken>()).Returns(15);
        _repository.GetPublicRatingsAndTotalsAsync(1, false, Arg.Any<CancellationToken>())
            .Returns(new WineryPublicRatingsAndTotalsRow(Labels: 4, Vintages: 8, RatingSum: 45, ReviewCount: 10));

        var ownerActor = new Actor(10, AppRoles.Winery, "bodega_test");

        // Act
        var result = await _service.GetPublicProfileAsync(1, actor: ownerActor);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsOwner);
        Assert.False(result.IsFollowedByMe);
        await _repository.DidNotReceive().IsFollowedByUserAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetPublicProfileAsync_PendingWinery_AnonymousUser_ThrowsNotFoundException()
    {
        // Arrange
        var winery = CreateWineryRow(2, WineryStatus.Pending);
        _repository.GetWineryPublicProfileRowAsync(2, Arg.Any<CancellationToken>()).Returns(winery);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() => _service.GetPublicProfileAsync(2, actor: null));
        Assert.Contains("Esta bodega no está disponible", ex.Message);
    }

    [Fact]
    public async Task GetPublicProfileAsync_PendingWinery_OtherUser_ThrowsNotFoundException()
    {
        // Arrange
        var winery = CreateWineryRow(2, WineryStatus.Pending, userId: 10);
        _repository.GetWineryPublicProfileRowAsync(2, Arg.Any<CancellationToken>()).Returns(winery);
        var actor = new Actor(UserId: 99, Role: AppRoles.User);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() => _service.GetPublicProfileAsync(2, actor));
        Assert.Contains("Esta bodega no está disponible", ex.Message);
    }

    [Fact]
    public async Task GetPublicProfileAsync_PendingWinery_Owner_ReturnsProfileWithIsPreviewTrue()
    {
        // Arrange
        var winery = CreateWineryRow(2, WineryStatus.Pending, userId: 10);
        _repository.GetWineryPublicProfileRowAsync(2, Arg.Any<CancellationToken>()).Returns(winery);
        _repository.GetFollowersCountAsync(2, Arg.Any<CancellationToken>()).Returns(3);
        _repository.IsFollowedByUserAsync(2, 10, Arg.Any<CancellationToken>()).Returns(false);
        _repository.GetPublicRatingsAndTotalsAsync(2, true, Arg.Any<CancellationToken>())
            .Returns(new WineryPublicRatingsAndTotalsRow(Labels: 2, Vintages: 3, RatingSum: 0, ReviewCount: 0));

        var actor = new Actor(UserId: 10, Role: AppRoles.Winery);

        // Act
        var result = await _service.GetPublicProfileAsync(2, actor);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsPreview);
        Assert.False(result.IsFollowedByMe);
        Assert.Null(result.AverageRating); // 0 reviews -> null
        Assert.Equal(0, result.ReviewCount);
        Assert.Equal(2, result.Totals.Labels);
        Assert.Equal(3, result.Totals.Vintages);
    }

    [Fact]
    public async Task GetPublicProfileAsync_ZeroReviews_ReturnsNullAverageRating()
    {
        // Arrange
        var winery = CreateWineryRow(1, WineryStatus.Approved);
        _repository.GetWineryPublicProfileRowAsync(1, Arg.Any<CancellationToken>()).Returns(winery);
        _repository.GetFollowersCountAsync(1, Arg.Any<CancellationToken>()).Returns(0);
        _repository.GetPublicRatingsAndTotalsAsync(1, false, Arg.Any<CancellationToken>())
            .Returns(new WineryPublicRatingsAndTotalsRow(Labels: 1, Vintages: 1, RatingSum: 0, ReviewCount: 0));

        // Act
        var result = await _service.GetPublicProfileAsync(1, actor: null);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.AverageRating);
        Assert.Equal(0, result.ReviewCount);
    }

    [Fact]
    public async Task GetPublicProfileAsync_FourReviews_BelowThreshold_ReturnsNullAverageRating()
    {
        // Arrange
        var winery = CreateWineryRow(1, WineryStatus.Approved);
        _repository.GetWineryPublicProfileRowAsync(1, Arg.Any<CancellationToken>()).Returns(winery);
        _repository.GetFollowersCountAsync(1, Arg.Any<CancellationToken>()).Returns(2);
        _repository.GetPublicRatingsAndTotalsAsync(1, false, Arg.Any<CancellationToken>())
            .Returns(new WineryPublicRatingsAndTotalsRow(Labels: 1, Vintages: 2, RatingSum: 16, ReviewCount: 4));

        // Act
        var result = await _service.GetPublicProfileAsync(1, actor: null);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.AverageRating); // 4 < 5 -> null
        Assert.Equal(4, result.ReviewCount);
    }

    [Fact]
    public async Task GetPublicProfileAsync_FiveReviews_ReachesThreshold_ReturnsCalculatedAverage()
    {
        // Arrange
        var winery = CreateWineryRow(1, WineryStatus.Approved);
        _repository.GetWineryPublicProfileRowAsync(1, Arg.Any<CancellationToken>()).Returns(winery);
        _repository.GetFollowersCountAsync(1, Arg.Any<CancellationToken>()).Returns(5);
        _repository.GetPublicRatingsAndTotalsAsync(1, false, Arg.Any<CancellationToken>())
            .Returns(new WineryPublicRatingsAndTotalsRow(Labels: 2, Vintages: 3, RatingSum: 20, ReviewCount: 5));

        // Act
        var result = await _service.GetPublicProfileAsync(1, actor: null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(4.0m, result.AverageRating); // 20 / 5 = 4.0
        Assert.Equal(5, result.ReviewCount);
    }

    [Fact]
    public async Task GetPublicProfileAsync_MoreThanFiveReviews_ReturnsCalculatedAverage()
    {
        // Arrange
        var winery = CreateWineryRow(1, WineryStatus.Approved);
        _repository.GetWineryPublicProfileRowAsync(1, Arg.Any<CancellationToken>()).Returns(winery);
        _repository.GetFollowersCountAsync(1, Arg.Any<CancellationToken>()).Returns(10);
        _repository.GetPublicRatingsAndTotalsAsync(1, false, Arg.Any<CancellationToken>())
            .Returns(new WineryPublicRatingsAndTotalsRow(Labels: 3, Vintages: 5, RatingSum: 48, ReviewCount: 10));

        // Act
        var result = await _service.GetPublicProfileAsync(1, actor: null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(4.8m, result.AverageRating); // 48 / 10 = 4.8
        Assert.Equal(10, result.ReviewCount);
    }

    [Fact]
    public async Task GetPublicProfileAsync_PendingWinery_Admin_ReturnsProfileWithIsPreviewTrue()
    {
        // Arrange
        var winery = CreateWineryRow(3, WineryStatus.Pending, userId: 15);
        _repository.GetWineryPublicProfileRowAsync(3, Arg.Any<CancellationToken>()).Returns(winery);
        _repository.GetFollowersCountAsync(3, Arg.Any<CancellationToken>()).Returns(0);
        _repository.IsFollowedByUserAsync(3, 999, Arg.Any<CancellationToken>()).Returns(true);
        _repository.GetPublicRatingsAndTotalsAsync(3, true, Arg.Any<CancellationToken>())
            .Returns(new WineryPublicRatingsAndTotalsRow(Labels: 1, Vintages: 1, RatingSum: 0, ReviewCount: 0));

        var adminActor = new Actor(UserId: 999, Role: AppRoles.Admin);

        // Act
        var result = await _service.GetPublicProfileAsync(3, adminActor);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsPreview);
        Assert.True(result.IsFollowedByMe);
    }

    [Fact]
    public async Task GetPublicCatalogAsync_InvalidPaging_ThrowsValidationException()
    {
        // Act & Assert (pageNumber < 1)
        var q1 = new WineryPublicCatalogQueryParams(PageNumber: 0, PageSize: 12);
        await Assert.ThrowsAsync<ValidationException>(() => _service.GetPublicCatalogAsync(1, null, q1));

        // Act & Assert (pageSize > 50)
        var q2 = new WineryPublicCatalogQueryParams(PageNumber: 1, PageSize: 51);
        await Assert.ThrowsAsync<ValidationException>(() => _service.GetPublicCatalogAsync(1, null, q2));
    }

    [Fact]
    public async Task GetPublicCatalogAsync_ApprovedWinery_ReturnsPagedItemsAndFilters()
    {
        // Arrange
        var winery = CreateWineryRow(1, WineryStatus.Approved);
        _repository.GetWineryPublicProfileRowAsync(1, Arg.Any<CancellationToken>()).Returns(winery);

        var filtersDto = new WineryPublicCatalogFiltersDto(
            WineTypes: new[] { "Red", "White" },
            Grapes: new[] { new WineryPublicGrapeFilterDto(1, "Malbec") },
            Years: new[] { 2022, 2021 });
        _repository.GetPublicCatalogFiltersAsync(1, false, Arg.Any<CancellationToken>()).Returns(filtersDto);

        var wineRows = new List<WineryCatalogWineRow>
        {
            new(Id: 101, Name: "Gran Malbec", Description: "Roble francés", WineType: WineType.Red, SourceType: SourceType.Official, RatingSum: 25, ReviewCount: 5)
        };
        var query = new WineryPublicCatalogQueryParams(PageNumber: 1, PageSize: 12, Sort: "name");
        _repository.GetPublicCatalogWinesPagedAsync(1, false, query, Arg.Any<CancellationToken>())
            .Returns((TotalCount: 1, Wines: wineRows));

        var vintageRows = new List<WineryCatalogVintageRow>
        {
            new(Id: 501, WineId: 101, Year: 2021, AlcoholContent: 14.5m, ServingTemperature: 16, AgingAdvice: "12 meses en barrica", ImageId: null, ApprovalStatus: ApprovalStatus.Approved, RegisterDate: DateTime.UtcNow, RatingSum: 25, ReviewCount: 5)
        };
        _repository.GetPublicVintagesByWineIdsAsync(Arg.Any<IEnumerable<int>>(), false, Arg.Any<CancellationToken>())
            .Returns(vintageRows);

        var grapeRows = new List<WineryCatalogGrapeRow>
        {
            new(WineVintageId: 501, GrapeId: 1, GrapeName: "Malbec", Percentage: 100m)
        };
        _repository.GetGrapesByVintageIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>())
            .Returns(grapeRows);

        // Act
        var result = await _service.GetPublicCatalogAsync(1, actor: null, query);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Equal(1, result.TotalPages);
        Assert.False(result.HasPreviousPage);
        Assert.False(result.HasNextPage);
        Assert.Single(result.Items);

        var wine = result.Items[0];
        Assert.Equal(101, wine.Id);
        Assert.Equal("Gran Malbec", wine.Name);
        Assert.Equal(5.0m, wine.AverageRating);
        Assert.Equal(5, wine.ReviewCount);
        Assert.Single(wine.Vintages);

        var vintage = wine.Vintages[0];
        Assert.Equal(501, vintage.Id);
        Assert.Equal(2021, vintage.Year);
        Assert.Equal("Approved", vintage.ApprovalStatus);
        Assert.Single(vintage.Grapes);
        Assert.Equal("Malbec", vintage.Grapes[0].GrapeName);
        Assert.Equal(100m, vintage.Grapes[0].Percentage);
    }

    [Fact]
    public async Task GetPublicCatalogAsync_SortByRating_MapsRatingsForZeroOneAndMultipleReviews()
    {
        // Arrange
        var winery = CreateWineryRow(1, WineryStatus.Approved);
        _repository.GetWineryPublicProfileRowAsync(1, Arg.Any<CancellationToken>()).Returns(winery);

        var filtersDto = new WineryPublicCatalogFiltersDto(
            WineTypes: new[] { "Red", "White" },
            Grapes: Array.Empty<WineryPublicGrapeFilterDto>(),
            Years: Array.Empty<int>());
        _repository.GetPublicCatalogFiltersAsync(1, false, Arg.Any<CancellationToken>()).Returns(filtersDto);

        var wineRows = new List<WineryCatalogWineRow>
        {
            new(Id: 1, Name: "Vino Diez Reseñas", Description: null, WineType: WineType.Red, SourceType: SourceType.Official, RatingSum: 48, ReviewCount: 10), // avg 4.8
            new(Id: 2, Name: "Vino Cinco Reseñas", Description: null, WineType: WineType.White, SourceType: SourceType.Official, RatingSum: 20, ReviewCount: 5),  // avg 4.0
            new(Id: 3, Name: "Vino Cuatro Reseñas", Description: null, WineType: WineType.Red, SourceType: SourceType.Official, RatingSum: 16, ReviewCount: 4),  // avg null (< 5)
            new(Id: 4, Name: "Vino Cero Reseñas", Description: null, WineType: WineType.Red, SourceType: SourceType.Official, RatingSum: 0, ReviewCount: 0)      // avg null (0)
        };
        var query = new WineryPublicCatalogQueryParams(PageNumber: 1, PageSize: 12, Sort: "rating");
        _repository.GetPublicCatalogWinesPagedAsync(1, false, Arg.Is<WineryPublicCatalogQueryParams>(q => q.Sort == "rating"), Arg.Any<CancellationToken>())
            .Returns((TotalCount: 4, Wines: wineRows));

        _repository.GetPublicVintagesByWineIdsAsync(Arg.Any<IEnumerable<int>>(), false, Arg.Any<CancellationToken>())
            .Returns(Array.Empty<WineryCatalogVintageRow>());
        _repository.GetGrapesByVintageIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>())
            .Returns(Array.Empty<WineryCatalogGrapeRow>());

        // Act
        var result = await _service.GetPublicCatalogAsync(1, actor: null, query);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(4, result.TotalCount);
        Assert.Equal(4, result.Items.Count);

        // Vino con más de 5 reseñas (expone promedio)
        Assert.Equal(1, result.Items[0].Id);
        Assert.Equal(4.8m, result.Items[0].AverageRating);
        Assert.Equal(10, result.Items[0].ReviewCount);

        // Vino con exactamente 5 reseñas (alcanza el umbral, expone promedio)
        Assert.Equal(2, result.Items[1].Id);
        Assert.Equal(4.0m, result.Items[1].AverageRating);
        Assert.Equal(5, result.Items[1].ReviewCount);

        // Vino con 4 reseñas (menor a 5, promedio null)
        Assert.Equal(3, result.Items[2].Id);
        Assert.Null(result.Items[2].AverageRating);
        Assert.Equal(4, result.Items[2].ReviewCount);

        // Vino con 0 reseñas (promedio null)
        Assert.Equal(4, result.Items[3].Id);
        Assert.Null(result.Items[3].AverageRating);
        Assert.Equal(0, result.Items[3].ReviewCount);
    }

    [Fact]
    public async Task GetPublicProfileAsync_RejectedWinery_AnonymousUser_ThrowsNotFoundException()
    {
        var winery = CreateWineryRow(3, WineryStatus.Rejected, userId: 10);
        _repository.GetWineryPublicProfileRowAsync(3, Arg.Any<CancellationToken>()).Returns(winery);

        var ex = await Assert.ThrowsAsync<NotFoundException>(() => _service.GetPublicProfileAsync(3, actor: null));
        Assert.Contains("Esta bodega no está disponible", ex.Message);
    }

    [Fact]
    public async Task GetPublicProfileAsync_RejectedWinery_Admin_ReturnsProfileWithIsPreviewTrue()
    {
        var winery = CreateWineryRow(3, WineryStatus.Rejected, userId: 10);
        _repository.GetWineryPublicProfileRowAsync(3, Arg.Any<CancellationToken>()).Returns(winery);
        _repository.GetFollowersCountAsync(3, Arg.Any<CancellationToken>()).Returns(0);
        _repository.GetPublicRatingsAndTotalsAsync(3, true, Arg.Any<CancellationToken>())
            .Returns(new WineryPublicRatingsAndTotalsRow(Labels: 1, Vintages: 1, RatingSum: 0, ReviewCount: 0));

        var adminActor = new Actor(UserId: 1, Role: AppRoles.Admin);
        var result = await _service.GetPublicProfileAsync(3, adminActor);

        Assert.NotNull(result);
        Assert.True(result.IsPreview);
        Assert.Equal("Rejected", result.Status);
    }

    [Fact]
    public async Task GetPublicCatalogAsync_PendingWinery_AnonymousUser_ThrowsNotFoundException()
    {
        var winery = CreateWineryRow(2, WineryStatus.Pending, userId: 10);
        _repository.GetWineryPublicProfileRowAsync(2, Arg.Any<CancellationToken>()).Returns(winery);

        var query = new WineryPublicCatalogQueryParams(1, 10, null, null, null, null, null);
        var ex = await Assert.ThrowsAsync<NotFoundException>(() => _service.GetPublicCatalogAsync(2, actor: null, query));
        Assert.Contains("Esta bodega no está disponible", ex.Message);
    }

    [Fact]
    public async Task GetPublicCatalogAsync_PendingWinery_Owner_ReturnsCatalogWithItems()
    {
        var winery = CreateWineryRow(2, WineryStatus.Pending, userId: 10);
        _repository.GetWineryPublicProfileRowAsync(2, Arg.Any<CancellationToken>()).Returns(winery);
        _repository.GetPublicCatalogFiltersAsync(2, true, Arg.Any<CancellationToken>())
            .Returns(new WineryPublicCatalogFiltersDto([], [], []));
        _repository.GetPublicCatalogWinesPagedAsync(2, true, Arg.Any<WineryPublicCatalogQueryParams>(), Arg.Any<CancellationToken>())
            .Returns((TotalCount: 0, Wines: (IReadOnlyList<WineryCatalogWineRow>)[]));

        var ownerActor = new Actor(UserId: 10, Role: AppRoles.Winery);
        var query = new WineryPublicCatalogQueryParams(1, 10, null, null, null, null, null);
        var result = await _service.GetPublicCatalogAsync(2, ownerActor, query);

        Assert.NotNull(result);
        Assert.Empty(result.Items);
    }
}
