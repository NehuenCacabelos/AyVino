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
}
