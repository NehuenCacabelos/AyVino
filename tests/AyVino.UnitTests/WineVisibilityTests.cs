using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class WineVisibilityTests
{
    private readonly IWineRepository _wineRepo = Substitute.For<IWineRepository>();
    private readonly IWineryRepository _wineryRepo = Substitute.For<IWineryRepository>();
    private readonly IWineVintageRepository _vintageRepo = Substitute.For<IWineVintageRepository>();
    private readonly IGrapeRepository _grapeRepo = Substitute.For<IGrapeRepository>();
    private readonly ILocationRepository _locationRepo = Substitute.For<ILocationRepository>();

    private readonly WineService _wineService;
    private readonly WineVintageService _vintageService;

    public WineVisibilityTests()
    {
        _wineService = new WineService(_wineRepo, _wineryRepo, _locationRepo, _grapeRepo);
        _vintageService = new WineVintageService(_vintageRepo, _wineRepo, _grapeRepo, _wineryRepo);
    }

    [Fact]
    public async Task GetByIdAsync_AnonymousUser_WineFromPendingWinery_ThrowsNotFoundException()
    {
        // Arrange
        var wine = new Wine { Id = 1, WineryId = 10, Name = "Gran Reserva", WineType = WineType.Red, SourceType = SourceType.Official };
        var winery = new Winery { Id = 10, UserId = 5, Name = "Bodega En Espera", Status = WineryStatus.Pending };

        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);
        _wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        // Act & Assert (anónimo -> actor null)
        await Assert.ThrowsAsync<NotFoundException>(() => _wineService.GetByIdAsync(1, actor: null));
    }

    [Fact]
    public async Task GetByIdAsync_Owner_WineFromPendingWinery_ReturnsWine()
    {
        // Arrange
        var wine = new Wine { Id = 1, WineryId = 10, Name = "Gran Reserva", WineType = WineType.Red, SourceType = SourceType.Official };
        var winery = new Winery { Id = 10, UserId = 5, Name = "Bodega En Espera", Status = WineryStatus.Pending };

        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);
        _wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var ownerActor = new Actor(5, AppRoles.Winery);

        // Act
        var result = await _wineService.GetByIdAsync(1, actor: ownerActor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Gran Reserva", result.Name);
    }

    [Fact]
    public async Task GetByIdAsync_Admin_WineFromPendingWinery_ReturnsWine()
    {
        // Arrange
        var wine = new Wine { Id = 1, WineryId = 10, Name = "Gran Reserva", WineType = WineType.Red, SourceType = SourceType.Official };
        var winery = new Winery { Id = 10, UserId = 5, Name = "Bodega En Espera", Status = WineryStatus.Pending };

        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);
        _wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var adminActor = new Actor(99, AppRoles.Admin);

        // Act
        var result = await _wineService.GetByIdAsync(1, actor: adminActor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Gran Reserva", result.Name);
    }

    [Fact]
    public async Task GetVintageByIdAsync_AnonymousUser_PendingVintage_ThrowsNotFoundException()
    {
        // Arrange
        var vintage = new WineVintage
        {
            Id = 50,
            WineId = 1,
            Year = 2022,
            ApprovalStatus = ApprovalStatus.Pending,
            UploadedByUserId = 12
        };

        _vintageRepo.GetByIdAsync(50, Arg.Any<CancellationToken>()).Returns(vintage);

        // Act & Assert (actor null)
        await Assert.ThrowsAsync<NotFoundException>(() => _vintageService.GetByIdAsync(1, 50, actor: null));
    }

    [Fact]
    public async Task GetVintageByIdAsync_UploaderUser_PendingVintage_ReturnsVintage()
    {
        // Arrange
        var vintage = new WineVintage
        {
            Id = 50,
            WineId = 1,
            Year = 2022,
            ApprovalStatus = ApprovalStatus.Pending,
            UploadedByUserId = 12
        };

        _vintageRepo.GetByIdAsync(50, Arg.Any<CancellationToken>()).Returns(vintage);
        _vintageRepo.GetGrapesByVintageIdAsync(50, Arg.Any<CancellationToken>()).Returns([]);

        var uploaderActor = new Actor(12, AppRoles.User);

        // Act
        var result = await _vintageService.GetByIdAsync(1, 50, actor: uploaderActor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2022, result.Year);
        Assert.Equal(ApprovalStatus.Pending.ToString(), result.ApprovalStatus);
    }

    [Fact]
    public async Task GetAllByWineIdAsync_AnonymousUser_FiltersOutPendingVintages()
    {
        // Arrange
        var wine = new Wine { Id = 1, WineryId = null, Name = "Vino Comunitario" };
        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var vintages = new List<WineVintage>
        {
            new() { Id = 101, WineId = 1, Year = 2020, ApprovalStatus = ApprovalStatus.Approved, UploadedByUserId = 1 },
            new() { Id = 102, WineId = 1, Year = 2021, ApprovalStatus = ApprovalStatus.Pending, UploadedByUserId = 2 },
            new() { Id = 103, WineId = 1, Year = 2022, ApprovalStatus = ApprovalStatus.Rejected, UploadedByUserId = 3 }
        };

        _vintageRepo.GetAllByWineIdAsync(1, Arg.Any<CancellationToken>()).Returns(vintages);
        _vintageRepo.GetGrapesByVintageIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>()).Returns([]);

        // Act (anónimo)
        var result = (await _vintageService.GetAllByWineIdAsync(1, actor: null)).ToList();

        // Assert: solo la cosecha aprobada es visible
        Assert.Single(result);
        Assert.Equal(101, result[0].Id);
        Assert.Equal(ApprovalStatus.Approved.ToString(), result[0].ApprovalStatus);
    }

    [Fact]
    public async Task GetAllByWineIdAsync_WineryOwner_SeesAllOwnVintages()
    {
        // Arrange
        var wine = new Wine { Id = 2, WineryId = 20, Name = "Vino Oficial" };
        var winery = new Winery { Id = 20, UserId = 7, Name = "Bodega Los Andes", Status = WineryStatus.Approved };

        _wineRepo.GetByIdAsync(2, Arg.Any<CancellationToken>()).Returns(wine);
        _wineryRepo.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(winery);

        var vintages = new List<WineVintage>
        {
            new() { Id = 201, WineId = 2, Year = 2019, ApprovalStatus = ApprovalStatus.Approved, UploadedByUserId = 7 },
            new() { Id = 202, WineId = 2, Year = 2020, ApprovalStatus = ApprovalStatus.Pending, UploadedByUserId = 7 },
            new() { Id = 203, WineId = 2, Year = 2021, ApprovalStatus = ApprovalStatus.Rejected, UploadedByUserId = 7 }
        };

        _vintageRepo.GetAllByWineIdAsync(2, Arg.Any<CancellationToken>()).Returns(vintages);
        _vintageRepo.GetGrapesByVintageIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>()).Returns([]);

        var ownerActor = new Actor(7, AppRoles.Winery);

        // Act
        var result = (await _vintageService.GetAllByWineIdAsync(2, actor: ownerActor)).ToList();

        // Assert: el dueño ve las 3 cosechas
        Assert.Equal(3, result.Count);
    }
}

