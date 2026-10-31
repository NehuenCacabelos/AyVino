using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Images.Repositories;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AyVino.UnitTests;

public class CommunityWineBlock5Tests
{
    private readonly IWineRepository _wineRepo = Substitute.For<IWineRepository>();
    private readonly IWineryRepository _wineryRepo = Substitute.For<IWineryRepository>();
    private readonly ILocationRepository _locationRepo = Substitute.For<ILocationRepository>();
    private readonly IGrapeRepository _grapeRepo = Substitute.For<IGrapeRepository>();
    private readonly IImageRepository _imageRepo = Substitute.For<IImageRepository>();
    private readonly IImageStorage _imageStorage = Substitute.For<IImageStorage>();
    private readonly ILogger<WineRepository> _logger = Substitute.For<ILogger<WineRepository>>();

    private readonly Actor _adminActor = new(1, AppRoles.Admin);
    private readonly Actor _userActor = new(2, AppRoles.User);

    private WineService CreateService() =>
        new(_wineRepo, _wineryRepo, _locationRepo, _grapeRepo);

    [Fact]
    public void MergeWinesResultDto_HasUserImageCountersAndDefaults()
    {
        // Act - instantiating with backward-compatible 7 parameters
        var dtoLegacy = new MergeWinesResultDto(1, 2, 3, 4, 5, 6, 7);

        // Assert
        Assert.Equal(0, dtoLegacy.MovedUserImages);
        Assert.Equal(0, dtoLegacy.DiscardedUserImages);
        Assert.Equal(0, dtoLegacy.MovedActivities);

        // Act - instantiating with all parameters
        var dtoFull = new MergeWinesResultDto(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        Assert.Equal(8, dtoFull.MovedUserImages);
        Assert.Equal(9, dtoFull.DiscardedUserImages);
        Assert.Equal(10, dtoFull.MovedActivities);
    }

    [Fact]
    public async Task MergeWinesAsync_WhenValidAdmin_PassesUserImageCounters()
    {
        // Arrange
        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 1, Name = "Vino Destino", WineType = WineType.Red });
        _wineRepo.GetByIdAsync(2, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 2, Name = "Vino Duplicado", WineType = WineType.Red });

        var expectedResult = new MergeWinesResultDto(
            TargetId: 1,
            DuplicateId: 2,
            MovedVintages: 1,
            MergedVintages: 1,
            MovedReviews: 2,
            DiscardedReviews: 1,
            MovedCellarItems: 1,
            MovedUserImages: 3,
            DiscardedUserImages: 2,
            MovedActivities: 0);

        _wineRepo.MergeWinesAsync(1, 2, Arg.Any<CancellationToken>())
            .Returns(expectedResult);

        var service = CreateService();

        // Act
        var result = await service.MergeWinesAsync(1, 2, _adminActor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(expectedResult, result);
        Assert.Equal(3, result.MovedUserImages);
        Assert.Equal(2, result.DiscardedUserImages);
        await _wineRepo.Received(1).MergeWinesAsync(1, 2, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task MergeWinesAsync_WhenUserIsNotAdmin_ThrowsForbiddenException()
    {
        // Arrange
        var service = CreateService();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.MergeWinesAsync(1, 2, _userActor));

        Assert.Contains("Solo un administrador", ex.Message);
        await _wineRepo.DidNotReceive().MergeWinesAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task MergeWinesAsync_WhenTargetIsDuplicate_ThrowsConflictException()
    {
        // Arrange
        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 1, Name = "Vino Destino", DuplicateOfWineId = 99, WineType = WineType.Red });
        _wineRepo.GetByIdAsync(2, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 2, Name = "Vino Duplicado", WineType = WineType.Red });

        var service = CreateService();

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(() =>
            service.MergeWinesAsync(1, 2, _adminActor));
    }

    [Fact]
    public async Task MergeWinesAsync_WhenDuplicateIsAlreadyMerged_ThrowsConflictException()
    {
        // Arrange
        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 1, Name = "Vino Destino", WineType = WineType.Red });
        _wineRepo.GetByIdAsync(2, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 2, Name = "Vino Duplicado", DuplicateOfWineId = 88, WineType = WineType.Red });

        var service = CreateService();

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(() =>
            service.MergeWinesAsync(1, 2, _adminActor));
    }

    [Fact]
    public async Task MergeWinesAsync_WhenValidAdmin_PassesMovedActivities()
    {
        // Arrange
        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 1, Name = "Vino Destino", WineType = WineType.Red });
        _wineRepo.GetByIdAsync(2, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 2, Name = "Vino Duplicado", WineType = WineType.Red });

        var expectedResult = new MergeWinesResultDto(
            TargetId: 1,
            DuplicateId: 2,
            MovedVintages: 1,
            MergedVintages: 1,
            MovedReviews: 2,
            DiscardedReviews: 1,
            MovedCellarItems: 1,
            MovedUserImages: 3,
            DiscardedUserImages: 2,
            MovedActivities: 7);

        _wineRepo.MergeWinesAsync(1, 2, Arg.Any<CancellationToken>())
            .Returns(expectedResult);

        var service = CreateService();

        // Act
        var result = await service.MergeWinesAsync(1, 2, _adminActor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(7, result.MovedActivities);
    }

    [Fact]
    public void WineRepository_Constructor_SupportsOptionalImageDependencies()
    {
        // Arrange & Act
        var repoWithAll = new WineRepository(
            connectionFactory: null!,
            communityOptions: null,
            imageRepository: _imageRepo,
            imageStorage: _imageStorage,
            logger: _logger);

        var repoMinimal = new WineRepository(connectionFactory: null!);

        // Assert
        Assert.NotNull(repoWithAll);
        Assert.NotNull(repoMinimal);
    }
}
