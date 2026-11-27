using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.AdminStats.DTOs;
using AyVino.Api.Features.AdminStats.Repositories;
using AyVino.Api.Features.AdminStats.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class AdminStatsServiceTests
{
    private readonly IAdminStatsRepository _repository = Substitute.For<IAdminStatsRepository>();
    private readonly AdminStatsService _service;

    public AdminStatsServiceTests()
    {
        _service = new AdminStatsService(_repository);
    }

    [Fact]
    public async Task GetStatsAsync_WhenUserIsNotAdmin_ThrowsForbiddenException()
    {
        // Arrange
        var userActor = new Actor(1, AppRoles.User, "regular_user");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.GetStatsAsync(userActor));

        Assert.Contains("Solo un administrador", ex.Message);
        await _repository.DidNotReceiveWithAnyArgs().GetStatsAsync(default);
    }

    [Fact]
    public async Task GetStatsAsync_WhenAdmin_ReturnsStatsFromRepository()
    {
        // Arrange
        var adminActor = new Actor(1, AppRoles.Admin, "admin_user");
        var expectedStats = new AdminStatsDto(
            Users: new UserStatsDto(150, 3),
            Wineries: new WineryStatsDto(Total: 31, Pending: 4, Approved: 25, Rejected: 2),
            Cities: new CityStatsDto(Pending: 5),
            Vintages: new VintageStatsDto(Pending: 8, Approved: 80, Rejected: 1),
            Wines: new WineStatsDto(Total: 45, Community: 15, Official: 30),
            Reviews: new ReviewStatsDto(Total: 320));

        _repository.GetStatsAsync(Arg.Any<CancellationToken>())
            .Returns(expectedStats);

        // Act
        var result = await _service.GetStatsAsync(adminActor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(expectedStats, result);
        Assert.Equal(150, result.Users.Total);
        Assert.Equal(3, result.Users.Blocked);
        Assert.Equal(31, result.Wineries.Total);
        Assert.Equal(4, result.Wineries.Pending);
        Assert.Equal(25, result.Wineries.Approved);
        Assert.Equal(2, result.Wineries.Rejected);
        Assert.Equal(5, result.Cities.Pending);
        Assert.Equal(8, result.Vintages.Pending);
        Assert.Equal(45, result.Wines.Total);
        Assert.Equal(320, result.Reviews.Total);

        await _repository.Received(1).GetStatsAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetGrapesDistributionAsync_WhenUserIsNotAdmin_ThrowsForbiddenException()
    {
        // Arrange
        var userActor = new Actor(1, AppRoles.User, "regular_user");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.GetGrapesDistributionAsync(userActor));

        Assert.Contains("Solo un administrador", ex.Message);
        await _repository.DidNotReceiveWithAnyArgs().GetGrapesDistributionAsync(default);
    }

    [Fact]
    public async Task GetGrapesDistributionAsync_WhenAdmin_ReturnsDistributionFromRepository()
    {
        // Arrange
        var adminActor = new Actor(1, AppRoles.Admin, "admin_user");
        var expected = new GrapesDistributionDto(
            TotalVintages: 12,
            Grapes:
            [
                new GrapePresenceDto(1, "Malbec", 9),
                new GrapePresenceDto(2, "Cabernet Sauvignon", 5)
            ]);

        _repository.GetGrapesDistributionAsync(Arg.Any<CancellationToken>())
            .Returns(expected);

        // Act
        var result = await _service.GetGrapesDistributionAsync(adminActor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(expected, result);
        Assert.Equal(12, result.TotalVintages);
        Assert.Equal(2, result.Grapes.Count);
        Assert.Equal("Malbec", result.Grapes[0].Name);

        await _repository.Received(1).GetGrapesDistributionAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetWineriesByRegionAsync_WhenUserIsNotAdmin_ThrowsForbiddenException()
    {
        // Arrange
        var userActor = new Actor(1, AppRoles.User, "regular_user");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.GetWineriesByRegionAsync(userActor));

        Assert.Contains("Solo un administrador", ex.Message);
        await _repository.DidNotReceiveWithAnyArgs().GetWineriesByRegionAsync(default);
    }

    [Fact]
    public async Task GetWineriesByRegionAsync_WhenAdmin_ReturnsWineriesByRegionFromRepository()
    {
        // Arrange
        var adminActor = new Actor(1, AppRoles.Admin, "admin_user");
        var expected = new WineriesByRegionDto(
            TotalWineries: 15,
            WithoutCoordinates: 2,
            Regions:
            [
                new RegionWineryCountDto(13, "Mendoza", 10),
                new RegionWineryCountDto(17, "Salta", 3)
            ],
            Pins:
            [
                new WineryPinDto(1, "Bodega A", -33.0123456m, -68.8765432m, "Mendoza", "Luján de Cuyo", 13),
                new WineryPinDto(2, "Bodega B", -26.0712345m, -65.9765432m, null, null, null)
            ],
            Wineries:
            [
                new RegionWineryItemDto(1, "Bodega A", 13, "Luján de Cuyo", 1995, true)
            ]);

        _repository.GetWineriesByRegionAsync(Arg.Any<CancellationToken>())
            .Returns(expected);

        // Act
        var result = await _service.GetWineriesByRegionAsync(adminActor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(expected, result);
        Assert.Equal(15, result.TotalWineries);
        Assert.Equal(2, result.WithoutCoordinates);
        Assert.Equal(2, result.Regions.Count);
        Assert.Equal(2, result.Pins.Count);

        await _repository.Received(1).GetWineriesByRegionAsync(Arg.Any<CancellationToken>());
    }
}
