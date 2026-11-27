using AyVino.Api.Features.Locations.Services;
using AyVino.Api.Features.Users.Services;
using AyVino.Api.Common.Security.Jwt;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Wineries.DTOs;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Services;
using NSubstitute;

namespace AyVino.UnitTests.Authorization;

public class WineryServiceAuthorizationTests
{
    private static WineryService CreateService(IWineryRepository wineryRepo, ILocationRepository locationRepo) =>
        new(
            wineryRepo,
            locationRepo,
            Substitute.For<ICityRepository>(),
            Substitute.For<IGeorefClient>(),
            Substitute.For<IUserService>(),
            Substitute.For<IJwtTokenGenerator>());


    private static Winery CreateWinery(int id, int? userId, WineryStatus status = WineryStatus.Approved) =>
        new()
        {
            Id = id,
            Name = "Bodega Los Andes",
            LocationId = 1,
            UserId = userId,
            Status = status,
            RegisterDate = DateTime.UtcNow
        };

    private static UpdateWineryRequestDto CreateUpdateDto(string name = "Bodega Modificada") =>
        new(name, 1, "Nueva descripción", 1980, "https://losandes.com");

    [Fact]
    public async Task UpdateAsync_OwnerActor_UpdatesSuccessfully()
    {
        // Arrange
        var winery = CreateWinery(id: 1, userId: 10);
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(winery);
        wineryRepo.UpdateAsync(Arg.Any<Winery>(), Arg.Any<CancellationToken>()).Returns(true);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = CreateService(wineryRepo, locationRepo);
        var actor = new Actor(10, AppRoles.User);

        // Act
        var result = await service.UpdateAsync(1, CreateUpdateDto(), actor);

        // Assert
        Assert.NotNull(result);
        await wineryRepo.Received(1).UpdateAsync(Arg.Any<Winery>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAsync_NonOwnerActor_ThrowsForbiddenException_AndDoesNotCallUpdate()
    {
        // Arrange
        var winery = CreateWinery(id: 1, userId: 10);
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(winery);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = CreateService(wineryRepo, locationRepo);
        var actor = new Actor(20, AppRoles.User);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateAsync(1, CreateUpdateDto(), actor));

        Assert.Equal("No tenés permiso para editar esta bodega.", ex.Message);
        await wineryRepo.DidNotReceiveWithAnyArgs().UpdateAsync(default!, default);
    }

    [Fact]
    public async Task UpdateAsync_WineryWithoutOwner_CommonUser_ThrowsForbiddenException_WithSpecificMessage_AndDoesNotCallUpdate()
    {
        // Arrange
        var winery = CreateWinery(id: 1, userId: null);
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(winery);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = CreateService(wineryRepo, locationRepo);
        var actor = new Actor(10, AppRoles.User);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateAsync(1, CreateUpdateDto(), actor));

        Assert.Equal("Solo un administrador puede editar una bodega sin dueño.", ex.Message);
        await wineryRepo.DidNotReceiveWithAnyArgs().UpdateAsync(default!, default);
    }

    [Fact]
    public async Task UpdateAsync_AdminActor_WineryWithoutOwner_UpdatesSuccessfully()
    {
        // Arrange
        var winery = CreateWinery(id: 1, userId: null);
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(winery);
        wineryRepo.UpdateAsync(Arg.Any<Winery>(), Arg.Any<CancellationToken>()).Returns(true);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = CreateService(wineryRepo, locationRepo);
        var actor = new Actor(99, AppRoles.Admin);

        // Act
        var result = await service.UpdateAsync(1, CreateUpdateDto(), actor);

        // Assert
        Assert.NotNull(result);
        await wineryRepo.Received(1).UpdateAsync(Arg.Any<Winery>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAsync_AdminActor_WineryWithOwner_UpdatesSuccessfully()
    {
        // Arrange
        var winery = CreateWinery(id: 1, userId: 10);
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(winery);
        wineryRepo.UpdateAsync(Arg.Any<Winery>(), Arg.Any<CancellationToken>()).Returns(true);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = CreateService(wineryRepo, locationRepo);
        var actor = new Actor(99, AppRoles.Admin);

        // Act
        var result = await service.UpdateAsync(1, CreateUpdateDto(), actor);

        // Assert
        Assert.NotNull(result);
        await wineryRepo.Received(1).UpdateAsync(Arg.Any<Winery>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAsync_NonExistentWinery_ThrowsNotFoundException_AndDoesNotCallUpdate()
    {
        // Arrange
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(999, Arg.Any<CancellationToken>()).Returns((Winery?)null);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = CreateService(wineryRepo, locationRepo);
        var actor = new Actor(10, AppRoles.User);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.UpdateAsync(999, CreateUpdateDto(), actor));

        await wineryRepo.DidNotReceiveWithAnyArgs().UpdateAsync(default!, default);
    }
}

