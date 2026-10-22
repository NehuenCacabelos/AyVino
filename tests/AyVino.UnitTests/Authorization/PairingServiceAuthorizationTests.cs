using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Pairings.Repositories;
using AyVino.Api.Features.Pairings.Services;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using NSubstitute;

namespace AyVino.UnitTests.Authorization;

public class PairingServiceAuthorizationTests
{
    private static Wine CreateWine(int id, int? wineryId) =>
        new()
        {
            Id = id,
            WineryId = wineryId,
            Name = "Vino Test",
            WineType = WineType.Red,
            SourceType = wineryId.HasValue ? SourceType.Official : SourceType.Community
        };

    private static Winery CreateWinery(int id, int? userId) =>
        new()
        {
            Id = id,
            Name = "Bodega Test",
            LocationId = 1,
            UserId = userId,
            Status = WineryStatus.Approved,
            RegisterDate = DateTime.UtcNow
        };

    [Fact]
    public async Task AddToWineAsync_CommonUser_ThrowsForbiddenException()
    {
        // Arrange
        var wine = CreateWine(id: 1, wineryId: 10);
        var winery = CreateWinery(id: 10, userId: 10);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var pairingRepo = Substitute.For<IPairingRepository>();
        var service = new PairingService(pairingRepo, wineRepo, wineryRepo);
        var actor = new Actor(20, AppRoles.User);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.AddToWineAsync(1, 5, actor));

        Assert.Equal("No tenés permiso para modificar los maridajes de este vino.", ex.Message);
        await pairingRepo.DidNotReceiveWithAnyArgs().AddToWineAsync(default, default, default);
    }

    [Fact]
    public async Task RemoveFromWineAsync_CommonUser_ThrowsForbiddenException()
    {
        // Arrange
        var wine = CreateWine(id: 1, wineryId: 10);
        var winery = CreateWinery(id: 10, userId: 10);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var pairingRepo = Substitute.For<IPairingRepository>();
        var service = new PairingService(pairingRepo, wineRepo, wineryRepo);
        var actor = new Actor(20, AppRoles.User);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.RemoveFromWineAsync(1, 5, actor));

        Assert.Equal("No tenés permiso para modificar los maridajes de este vino.", ex.Message);
        await pairingRepo.DidNotReceiveWithAnyArgs().RemoveFromWineAsync(default, default, default);
    }

    [Fact]
    public async Task AddToWineAsync_WineOwner_Succeeds()
    {
        // Arrange
        var wine = CreateWine(id: 1, wineryId: 10);
        var winery = CreateWinery(id: 10, userId: 10);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var pairingRepo = Substitute.For<IPairingRepository>();
        pairingRepo.ExistsByIdAsync(5, Arg.Any<CancellationToken>()).Returns(true);
        pairingRepo.IsAssociatedAsync(1, 5, Arg.Any<CancellationToken>()).Returns(false);

        var service = new PairingService(pairingRepo, wineRepo, wineryRepo);
        var actor = new Actor(10, AppRoles.Winery);

        // Act
        await service.AddToWineAsync(1, 5, actor);

        // Assert
        await pairingRepo.Received(1).AddToWineAsync(1, 5, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task RemoveFromWineAsync_WineOwner_Succeeds()
    {
        // Arrange
        var wine = CreateWine(id: 1, wineryId: 10);
        var winery = CreateWinery(id: 10, userId: 10);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var pairingRepo = Substitute.For<IPairingRepository>();
        pairingRepo.RemoveFromWineAsync(1, 5, Arg.Any<CancellationToken>()).Returns(true);

        var service = new PairingService(pairingRepo, wineRepo, wineryRepo);
        var actor = new Actor(10, AppRoles.Winery);

        // Act
        await service.RemoveFromWineAsync(1, 5, actor);

        // Assert
        await pairingRepo.Received(1).RemoveFromWineAsync(1, 5, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task AddToWineAsync_OwnerOfDifferentWinery_ThrowsForbiddenException()
    {
        // Arrange
        var wine = CreateWine(id: 1, wineryId: 10);
        var winery = CreateWinery(id: 10, userId: 10);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var pairingRepo = Substitute.For<IPairingRepository>();
        var service = new PairingService(pairingRepo, wineRepo, wineryRepo);
        var actor = new Actor(20, AppRoles.Winery);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.AddToWineAsync(1, 5, actor));

        Assert.Equal("No tenés permiso para modificar los maridajes de este vino.", ex.Message);
    }

    [Fact]
    public async Task AddToWineAsync_CommunityWine_NonAdminUser_ThrowsForbiddenException()
    {
        // Arrange
        var wine = CreateWine(id: 1, wineryId: null);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var pairingRepo = Substitute.For<IPairingRepository>();
        var service = new PairingService(pairingRepo, wineRepo, Substitute.For<IWineryRepository>());
        var actor = new Actor(10, AppRoles.User);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.AddToWineAsync(1, 5, actor));

        Assert.Equal("No tenés permiso para modificar los maridajes de este vino.", ex.Message);
    }

    [Fact]
    public async Task AddToWineAsync_Admin_CommunityWine_Succeeds()
    {
        // Arrange
        var wine = CreateWine(id: 1, wineryId: null);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var pairingRepo = Substitute.For<IPairingRepository>();
        pairingRepo.ExistsByIdAsync(5, Arg.Any<CancellationToken>()).Returns(true);
        pairingRepo.IsAssociatedAsync(1, 5, Arg.Any<CancellationToken>()).Returns(false);

        var service = new PairingService(pairingRepo, wineRepo, Substitute.For<IWineryRepository>());
        var actor = new Actor(99, AppRoles.Admin);

        // Act
        await service.AddToWineAsync(1, 5, actor);

        // Assert
        await pairingRepo.Received(1).AddToWineAsync(1, 5, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task RemoveFromWineAsync_Admin_AnyWine_Succeeds()
    {
        // Arrange
        var wine = CreateWine(id: 1, wineryId: 10);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var pairingRepo = Substitute.For<IPairingRepository>();
        pairingRepo.RemoveFromWineAsync(1, 5, Arg.Any<CancellationToken>()).Returns(true);

        var service = new PairingService(pairingRepo, wineRepo, Substitute.For<IWineryRepository>());
        var actor = new Actor(99, AppRoles.Admin);

        // Act
        await service.RemoveFromWineAsync(1, 5, actor);

        // Assert
        await pairingRepo.Received(1).RemoveFromWineAsync(1, 5, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task AddToWineAsync_NonExistentWine_ThrowsNotFoundException()
    {
        // Arrange
        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(999, Arg.Any<CancellationToken>()).Returns((Wine?)null);

        var pairingRepo = Substitute.For<IPairingRepository>();
        var service = new PairingService(pairingRepo, wineRepo, Substitute.For<IWineryRepository>());
        var actor = new Actor(1, AppRoles.User);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            service.AddToWineAsync(999, 5, actor));

        Assert.Equal("Wine with ID 999 not found.", ex.Message);
    }
}

