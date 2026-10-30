using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Common.Security.Jwt;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Locations.Services;
using AyVino.Api.Features.Users.Services;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class WineryVisibilityTests
{
    private static WineryService CreateService(IWineryRepository wineryRepo) =>
        new(
            wineryRepo,
            Substitute.For<ILocationRepository>(),
            Substitute.For<ICityRepository>(),
            Substitute.For<IGeorefClient>(),
            Substitute.For<IUserService>(),
            Substitute.For<IJwtTokenGenerator>());

    private static Winery CreateWinery(int id, int? userId, WineryStatus status) =>
        new()
        {
            Id = id,
            Name = "Bodega Los Andes",
            LocationId = 1,
            UserId = userId,
            Status = status,
            RegisterDate = DateTime.UtcNow
        };

    [Theory]
    [InlineData(null)]
    [InlineData("Pending")]
    [InlineData("Rejected")]
    public async Task GetAllAsync_Anonymous_AlwaysForcesApprovedStatus(string? inputStatus)
    {
        // Arrange
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetAllAsync(1, 10, (int)WineryStatus.Approved, null, Arg.Any<CancellationToken>())
            .Returns([CreateWinery(1, 10, WineryStatus.Approved)]);

        var service = CreateService(wineryRepo);

        // Act
        var result = await service.GetAllAsync(1, 10, inputStatus, null, actor: null);

        // Assert
        Assert.Single(result);
        await wineryRepo.Received(1).GetAllAsync(1, 10, (int)WineryStatus.Approved, null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetAllAsync_CommonUser_AlwaysForcesApprovedStatus_EvenIfRequestsRejected()
    {
        // Arrange
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetAllAsync(1, 10, (int)WineryStatus.Approved, null, Arg.Any<CancellationToken>())
            .Returns([CreateWinery(1, 10, WineryStatus.Approved)]);

        var service = CreateService(wineryRepo);
        var actor = new Actor(5, AppRoles.User);

        // Act
        var result = await service.GetAllAsync(1, 10, "Rejected", null, actor);

        // Assert
        Assert.Single(result);
        await wineryRepo.Received(1).GetAllAsync(1, 10, (int)WineryStatus.Approved, null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetAllAsync_Admin_WithNullStatus_PassesNullToRepository()
    {
        // Arrange
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetAllAsync(1, 10, null, null, Arg.Any<CancellationToken>())
            .Returns([CreateWinery(1, 10, WineryStatus.Approved), CreateWinery(2, 11, WineryStatus.Rejected)]);

        var service = CreateService(wineryRepo);
        var adminActor = new Actor(99, AppRoles.Admin);

        // Act
        var result = await service.GetAllAsync(1, 10, null, null, adminActor);

        // Assert
        Assert.Equal(2, result.Count());
        await wineryRepo.Received(1).GetAllAsync(1, 10, null, null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetAllAsync_Admin_WithExplicitStatus_PassesParsedStatusToRepository()
    {
        // Arrange
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetAllAsync(1, 10, (int)WineryStatus.Rejected, null, Arg.Any<CancellationToken>())
            .Returns([CreateWinery(2, 11, WineryStatus.Rejected)]);

        var service = CreateService(wineryRepo);
        var adminActor = new Actor(99, AppRoles.Admin);

        // Act
        var result = await service.GetAllAsync(1, 10, "Rejected", null, adminActor);

        // Assert
        Assert.Single(result);
        await wineryRepo.Received(1).GetAllAsync(1, 10, (int)WineryStatus.Rejected, null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetByIdAsync_ApprovedWinery_AccessibleByAnyone()
    {
        // Arrange
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(CreateWinery(1, 10, WineryStatus.Approved));

        var service = CreateService(wineryRepo);

        // Act & Assert
        // Anonymous
        var anon = await service.GetByIdAsync(1, actor: null);
        Assert.Equal("Bodega Los Andes", anon.Name);

        // Other user
        var user = await service.GetByIdAsync(1, new Actor(99, AppRoles.User));
        Assert.Equal("Bodega Los Andes", user.Name);
    }

    [Fact]
    public async Task GetByIdAsync_RejectedWinery_Anonymous_ThrowsNotFoundException()
    {
        // Arrange
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(CreateWinery(1, 10, WineryStatus.Rejected));

        var service = CreateService(wineryRepo);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.GetByIdAsync(1, actor: null));
    }

    [Fact]
    public async Task GetByIdAsync_RejectedWinery_UnrelatedUser_ThrowsNotFoundException()
    {
        // Arrange
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(CreateWinery(1, 10, WineryStatus.Rejected));

        var service = CreateService(wineryRepo);
        var unrelatedActor = new Actor(99, AppRoles.User);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.GetByIdAsync(1, unrelatedActor));
    }

    [Fact]
    public async Task GetByIdAsync_RejectedWinery_Owner_ReturnsWinery()
    {
        // Arrange
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(CreateWinery(1, 10, WineryStatus.Rejected));

        var service = CreateService(wineryRepo);
        var ownerActor = new Actor(10, AppRoles.Winery);

        // Act
        var result = await service.GetByIdAsync(1, ownerActor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Bodega Los Andes", result.Name);
        Assert.Equal(WineryStatus.Rejected.ToString(), result.Status);
    }

    [Fact]
    public async Task GetByIdAsync_RejectedWinery_Admin_ReturnsWinery()
    {
        // Arrange
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(CreateWinery(1, 10, WineryStatus.Rejected));

        var service = CreateService(wineryRepo);
        var adminActor = new Actor(99, AppRoles.Admin);

        // Act
        var result = await service.GetByIdAsync(1, adminActor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Bodega Los Andes", result.Name);
        Assert.Equal(WineryStatus.Rejected.ToString(), result.Status);
    }
}
