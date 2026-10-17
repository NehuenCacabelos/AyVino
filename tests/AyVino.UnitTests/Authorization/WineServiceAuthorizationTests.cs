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

namespace AyVino.UnitTests.Authorization;

public class WineServiceAuthorizationTests
{
    private static Winery CreateWinery(int id, int? userId, WineryStatus status = WineryStatus.Approved) =>
        new()
        {
            Id = id,
            Name = "Bodega Rutini",
            LocationId = 1,
            UserId = userId,
            Status = status,
            RegisterDate = DateTime.UtcNow
        };

    private static Wine CreateWine(int id, int? wineryId, SourceType sourceType) =>
        new()
        {
            Id = id,
            WineryId = wineryId,
            WineryNameText = wineryId is null ? "Comunidad" : null,
            Name = "Vino Test",
            WineType = WineType.Red,
            LocationId = 1,
            SourceType = sourceType
        };

    private static CreateWineRequestDto CreateWineDto(int? wineryId) =>
        new(
            WineryId: wineryId,
            WineryNameText: wineryId is null ? "Bodega Artesanal" : null,
            Name: "Gran Corte",
            Description: "Notas especiadas",
            WineType: "Red",
            LocationId: 1,
            FirstVintage: new CreateWineVintageRequestDto(Year: 2021)
        );

    private static UpdateWineRequestDto UpdateWineDto(int? wineryId, string name = "Gran Corte Modificado") =>
        new(
            WineryId: wineryId,
            WineryNameText: wineryId is null ? "Bodega Artesanal" : null,
            Name: name,
            Description: "Notas modificadas",
            WineType: "Red",
            LocationId: 1
        );

    #region R2 - CreateAsync

    [Fact]
    public async Task CreateAsync_CommonUser_WithWineryId_ThrowsForbiddenException()
    {
        // Arrange
        var winery = CreateWinery(10, userId: 99, status: WineryStatus.Approved);
        var wineRepo = Substitute.For<IWineRepository>();
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineService(wineRepo, wineryRepo, locationRepo, Substitute.For<IGrapeRepository>());
        var actor = new Actor(1, AppRoles.User);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.CreateAsync(CreateWineDto(wineryId: 10), actor));

        Assert.Equal("Solo el dueño de la bodega puede publicar vinos oficiales a su nombre.", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_Owner_WithApprovedWinery_SucceedsAndCreatesOfficialWine()
    {
        // Arrange
        var winery = CreateWinery(10, userId: 10, status: WineryStatus.Approved);
        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.CreateWithFirstVintageAsync(Arg.Any<Wine>(), Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>())
            .Returns(args => ((Wine)args[0]) with { Id = 100 });

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineService(wineRepo, wineryRepo, locationRepo, Substitute.For<IGrapeRepository>());
        var actor = new Actor(10, AppRoles.Winery);

        // Act
        var result = await service.CreateAsync(CreateWineDto(wineryId: 10), actor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(SourceType.Official.ToString(), result.SourceType);
        await wineRepo.Received(1).CreateWithFirstVintageAsync(
            Arg.Is<Wine>(w => w.SourceType == SourceType.Official && w.WineryId == 10),
            Arg.Any<WineVintage>(),
            Arg.Any<IEnumerable<WineGrape>>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateAsync_Owner_WithPendingWinery_ThrowsForbiddenException()
    {
        // Arrange
        var winery = CreateWinery(10, userId: 10, status: WineryStatus.Pending);
        var wineRepo = Substitute.For<IWineRepository>();
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineService(wineRepo, wineryRepo, locationRepo, Substitute.For<IGrapeRepository>());
        var actor = new Actor(10, AppRoles.Winery);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.CreateAsync(CreateWineDto(wineryId: 10), actor));

        Assert.Equal("La bodega debe estar aprobada para publicar vinos oficiales.", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_AdminActor_WithAnyWinery_Succeeds()
    {
        // Arrange
        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.CreateWithFirstVintageAsync(Arg.Any<Wine>(), Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>())
            .Returns(args => ((Wine)args[0]) with { Id = 100 });

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineService(wineRepo, wineryRepo, locationRepo, Substitute.For<IGrapeRepository>());
        var actor = new Actor(99, AppRoles.Admin);

        // Act
        var result = await service.CreateAsync(CreateWineDto(wineryId: 10), actor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(SourceType.Official.ToString(), result.SourceType);
    }

    [Fact]
    public async Task CreateAsync_CommonUser_WithoutWineryId_SucceedsAndCreatesCommunityWine()
    {
        // Arrange
        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.CreateWithFirstVintageAsync(Arg.Any<Wine>(), Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>())
            .Returns(args => ((Wine)args[0]) with { Id = 100 });

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineService(wineRepo, Substitute.For<IWineryRepository>(), locationRepo, Substitute.For<IGrapeRepository>());
        var actor = new Actor(1, AppRoles.User);

        // Act
        var result = await service.CreateAsync(CreateWineDto(wineryId: null), actor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(SourceType.Community.ToString(), result.SourceType);
        await wineRepo.Received(1).CreateWithFirstVintageAsync(
            Arg.Is<Wine>(w => w.SourceType == SourceType.Community && w.WineryId == null),
            Arg.Any<WineVintage>(),
            Arg.Any<IEnumerable<WineGrape>>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateAsync_NonExistentWinery_ThrowsValidationException()
    {
        // Arrange
        var wineRepo = Substitute.For<IWineRepository>();
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.ExistsByIdAsync(999, Arg.Any<CancellationToken>()).Returns(false);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineService(wineRepo, wineryRepo, locationRepo, Substitute.For<IGrapeRepository>());
        var actor = new Actor(1, AppRoles.User);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.CreateAsync(CreateWineDto(wineryId: 999), actor));

        Assert.Contains("Winery with ID 999 does not exist", ex.Message);
    }

    #endregion

    #region R3 - UpdateAsync

    [Fact]
    public async Task UpdateAsync_NonOwner_OnOfficialWine_ThrowsForbiddenException()
    {
        // Arrange
        var existingWine = CreateWine(id: 1, wineryId: 10, SourceType.Official);
        var winery = CreateWinery(10, userId: 10);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(existingWine);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var service = new WineService(wineRepo, wineryRepo, Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var actor = new Actor(20, AppRoles.User);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateAsync(1, UpdateWineDto(wineryId: 10), actor));

        Assert.Equal("No tenés permiso para editar este vino.", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_Owner_KeepingSameWineryId_Succeeds()
    {
        // Arrange
        var existingWine = CreateWine(id: 1, wineryId: 10, SourceType.Official);
        var winery = CreateWinery(10, userId: 10);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(existingWine);
        wineRepo.UpdateAsync(Arg.Any<Wine>(), Arg.Any<CancellationToken>()).Returns(true);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);
        wineryRepo.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineService(wineRepo, wineryRepo, locationRepo, Substitute.For<IGrapeRepository>());
        var actor = new Actor(10, AppRoles.Winery);

        // Act
        var result = await service.UpdateAsync(1, UpdateWineDto(wineryId: 10), actor);

        // Assert
        Assert.NotNull(result);
        await wineRepo.Received(1).UpdateAsync(
            Arg.Is<Wine>(w => w.WineryId == 10 && w.SourceType == SourceType.Official),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAsync_Owner_ChangingWineryId_ThrowsForbiddenException()
    {
        // Arrange
        var existingWine = CreateWine(id: 1, wineryId: 10, SourceType.Official);
        var winery = CreateWinery(10, userId: 10);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(existingWine);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var service = new WineService(wineRepo, wineryRepo, Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var actor = new Actor(10, AppRoles.Winery);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateAsync(1, UpdateWineDto(wineryId: 20), actor));

        Assert.Equal("Solo un administrador puede cambiar la bodega de un vino.", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_Owner_SettingWineryIdToNull_ThrowsForbiddenException()
    {
        // Arrange
        var existingWine = CreateWine(id: 1, wineryId: 10, SourceType.Official);
        var winery = CreateWinery(10, userId: 10);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(existingWine);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var service = new WineService(wineRepo, wineryRepo, Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var actor = new Actor(10, AppRoles.Winery);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateAsync(1, UpdateWineDto(wineryId: null), actor));

        Assert.Equal("Solo un administrador puede cambiar la bodega de un vino.", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_CommonUser_OnCommunityWine_ThrowsForbiddenException()
    {
        // Arrange
        var existingWine = CreateWine(id: 1, wineryId: null, SourceType.Community);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(existingWine);

        var service = new WineService(wineRepo, Substitute.For<IWineryRepository>(), Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var actor = new Actor(1, AppRoles.User);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateAsync(1, UpdateWineDto(wineryId: null), actor));

        Assert.Equal("Solo un administrador puede editar vinos comunitarios.", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_Admin_OnCommunityWine_Succeeds()
    {
        // Arrange
        var existingWine = CreateWine(id: 1, wineryId: null, SourceType.Community);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(existingWine);
        wineRepo.UpdateAsync(Arg.Any<Wine>(), Arg.Any<CancellationToken>()).Returns(true);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineService(wineRepo, Substitute.For<IWineryRepository>(), locationRepo, Substitute.For<IGrapeRepository>());
        var actor = new Actor(99, AppRoles.Admin);

        // Act
        var result = await service.UpdateAsync(1, UpdateWineDto(wineryId: null), actor);

        // Assert
        Assert.NotNull(result);
        await wineRepo.Received(1).UpdateAsync(
            Arg.Is<Wine>(w => w.WineryId == null && w.SourceType == SourceType.Community),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAsync_Admin_AssignsWineryId_PersistsAsOfficial()
    {
        // Arrange
        var existingWine = CreateWine(id: 1, wineryId: null, SourceType.Community);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(existingWine);
        wineRepo.UpdateAsync(Arg.Any<Wine>(), Arg.Any<CancellationToken>()).Returns(true);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineService(wineRepo, wineryRepo, locationRepo, Substitute.For<IGrapeRepository>());
        var actor = new Actor(99, AppRoles.Admin);

        // Act
        var result = await service.UpdateAsync(1, UpdateWineDto(wineryId: 10), actor);

        // Assert
        Assert.NotNull(result);
        await wineRepo.Received(1).UpdateAsync(
            Arg.Is<Wine>(w => w.WineryId == 10 && w.SourceType == SourceType.Official),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAsync_Admin_RemovesWineryId_PersistsAsCommunity()
    {
        // Arrange
        var existingWine = CreateWine(id: 1, wineryId: 10, SourceType.Official);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(existingWine);
        wineRepo.UpdateAsync(Arg.Any<Wine>(), Arg.Any<CancellationToken>()).Returns(true);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineService(wineRepo, Substitute.For<IWineryRepository>(), locationRepo, Substitute.For<IGrapeRepository>());
        var actor = new Actor(99, AppRoles.Admin);

        // Act
        var result = await service.UpdateAsync(1, UpdateWineDto(wineryId: null), actor);

        // Assert
        Assert.NotNull(result);
        await wineRepo.Received(1).UpdateAsync(
            Arg.Is<Wine>(w => w.WineryId == null && w.SourceType == SourceType.Community),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAsync_NonExistentWine_ThrowsNotFoundException()
    {
        // Arrange
        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(999, Arg.Any<CancellationToken>()).Returns((Wine?)null);

        var service = new WineService(wineRepo, Substitute.For<IWineryRepository>(), Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var actor = new Actor(1, AppRoles.User);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.UpdateAsync(999, UpdateWineDto(wineryId: null), actor));
    }

    #endregion

    #region R5 - Claim

    [Fact]
    public async Task Claim_CommonUser_ThrowsForbiddenException()
    {
        // Arrange
        var winery = CreateWinery(10, userId: 10, status: WineryStatus.Approved);
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var service = new WineService(Substitute.For<IWineRepository>(), wineryRepo, Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var actor = new Actor(20, AppRoles.User);

        // Act & Assert
        var exCandidates = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.GetClaimCandidatesAsync(10, actor));
        Assert.Equal("Solo el dueño de la bodega puede reclamar vinos.", exCandidates.Message);

        var exClaim = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.ClaimWinesAsync(10, [1], actor));
        Assert.Equal("Solo el dueño de la bodega puede reclamar vinos.", exClaim.Message);
    }

    [Fact]
    public async Task Claim_OwnerOfDifferentWinery_ThrowsForbiddenException()
    {
        // Arrange
        var winery = CreateWinery(10, userId: 10, status: WineryStatus.Approved);
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var service = new WineService(Substitute.For<IWineRepository>(), wineryRepo, Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var actor = new Actor(20, AppRoles.Winery);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.ClaimWinesAsync(10, [1], actor));
        Assert.Equal("Solo el dueño de la bodega puede reclamar vinos.", ex.Message);
    }

    [Fact]
    public async Task Claim_OwnerWithPendingWinery_ThrowsForbiddenException()
    {
        // Arrange
        var winery = CreateWinery(10, userId: 10, status: WineryStatus.Pending);
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var service = new WineService(Substitute.For<IWineRepository>(), wineryRepo, Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var actor = new Actor(10, AppRoles.Winery);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.ClaimWinesAsync(10, [1], actor));
        Assert.Equal("La bodega debe estar aprobada para reclamar vinos.", ex.Message);
    }

    [Fact]
    public async Task Claim_OwnerWithApprovedWinery_Succeeds()
    {
        // Arrange
        var winery = CreateWinery(10, userId: 10, status: WineryStatus.Approved);
        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.ClaimWinesAsync(10, Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>()).Returns(1);
        wineRepo.GetByIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>())
            .Returns([CreateWine(1, 10, SourceType.Official)]);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var service = new WineService(wineRepo, wineryRepo, Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var actor = new Actor(10, AppRoles.Winery);

        // Act
        var result = await service.ClaimWinesAsync(10, [1], actor);

        // Assert
        Assert.Single(result);
        Assert.Equal(1, result.First().Id);
    }

    [Fact]
    public async Task Claim_Admin_WithPendingOrUnownedWinery_Succeeds()
    {
        // Arrange
        var winery = CreateWinery(10, userId: null, status: WineryStatus.Pending);
        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.ClaimWinesAsync(10, Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>()).Returns(1);
        wineRepo.GetByIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>())
            .Returns([CreateWine(1, 10, SourceType.Official)]);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var service = new WineService(wineRepo, wineryRepo, Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var actor = new Actor(99, AppRoles.Admin);

        // Act
        var result = await service.ClaimWinesAsync(10, [1], actor);

        // Assert
        Assert.Single(result);
    }

    [Fact]
    public async Task Claim_NonExistentWinery_ThrowsNotFoundException()
    {
        // Arrange
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(999, Arg.Any<CancellationToken>()).Returns((Winery?)null);

        var service = new WineService(Substitute.For<IWineRepository>(), wineryRepo, Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var actor = new Actor(10, AppRoles.Winery);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            service.ClaimWinesAsync(999, [1], actor));
        Assert.Equal("Winery with ID 999 not found.", ex.Message);
    }

    #endregion
}

