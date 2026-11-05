using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class WineMergeTests
{
    private readonly IWineRepository _wineRepo = Substitute.For<IWineRepository>();
    private readonly IWineryRepository _wineryRepo = Substitute.For<IWineryRepository>();
    private readonly ILocationRepository _locationRepo = Substitute.For<ILocationRepository>();
    private readonly IGrapeRepository _grapeRepo = Substitute.For<IGrapeRepository>();

    private readonly Actor _adminActor = new(1, AppRoles.Admin);
    private readonly Actor _userActor = new(2, AppRoles.User);

    private WineService CreateService() =>
        new(_wineRepo, _wineryRepo, _locationRepo, _grapeRepo);

    [Fact]
    public async Task MergeWinesAsync_WhenUserIsNotAdmin_ThrowsForbiddenException()
    {
        // Arrange
        var service = CreateService();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.MergeWinesAsync(1, 2, _userActor));

        Assert.Contains("Solo un administrador", ex.Message);
    }

    [Fact]
    public async Task MergeWinesAsync_WhenTargetEqualsDuplicate_ThrowsValidationException()
    {
        // Arrange
        var service = CreateService();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.MergeWinesAsync(1, 1, _adminActor));

        Assert.Contains("consigo mismo", ex.Message);
    }

    [Fact]
    public async Task MergeWinesAsync_WhenTargetNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns((Wine?)null);
        var service = CreateService();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            service.MergeWinesAsync(1, 2, _adminActor));

        Assert.Contains("El vino destino con ID 1 no existe", ex.Message);
    }

    [Fact]
    public async Task MergeWinesAsync_WhenDuplicateNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 1, Name = "Vino Destino", WineType = WineType.Red });
        _wineRepo.GetByIdAsync(2, Arg.Any<CancellationToken>())
            .Returns((Wine?)null);
        var service = CreateService();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            service.MergeWinesAsync(1, 2, _adminActor));

        Assert.Contains("El vino a fusionar con ID 2 no existe", ex.Message);
    }

    [Fact]
    public async Task MergeWinesAsync_WhenTargetAlreadyDuplicate_ThrowsConflictException()
    {
        // Arrange
        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 1, Name = "Vino Destino", DuplicateOfWineId = 99, WineType = WineType.Red });
        _wineRepo.GetByIdAsync(2, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 2, Name = "Vino Origen", WineType = WineType.Red });
        var service = CreateService();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            service.MergeWinesAsync(1, 2, _adminActor));

        Assert.Contains("ya es un vino duplicado", ex.Message);
    }

    [Fact]
    public async Task MergeWinesAsync_WhenDuplicateAlreadyMerged_ThrowsConflictException()
    {
        // Arrange
        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 1, Name = "Vino Destino", WineType = WineType.Red });
        _wineRepo.GetByIdAsync(2, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 2, Name = "Vino Origen", DuplicateOfWineId = 99, WineType = WineType.Red });
        var service = CreateService();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            service.MergeWinesAsync(1, 2, _adminActor));

        Assert.Contains("ya fue fusionado anteriormente", ex.Message);
    }

    [Fact]
    public async Task MergeWinesAsync_WhenValidAdmin_CallsRepositoryAndReturnsResult()
    {
        // Arrange
        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 1, Name = "Vino Destino", WineType = WineType.Red });
        _wineRepo.GetByIdAsync(2, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 2, Name = "Vino Origen", WineType = WineType.Red });

        var expectedResult = new MergeWinesResultDto(
            TargetId: 1,
            DuplicateId: 2,
            MovedVintages: 2,
            MergedVintages: 1,
            MovedReviews: 3,
            DiscardedReviews: 1,
            MovedCellarItems: 2);

        _wineRepo.MergeWinesAsync(1, 2, Arg.Any<CancellationToken>())
            .Returns(expectedResult);

        var service = CreateService();

        // Act
        var result = await service.MergeWinesAsync(1, 2, _adminActor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(expectedResult, result);
        await _wineRepo.Received(1).MergeWinesAsync(1, 2, Arg.Any<CancellationToken>());
    }
}
