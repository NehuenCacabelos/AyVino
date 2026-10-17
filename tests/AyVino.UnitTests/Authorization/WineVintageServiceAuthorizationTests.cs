using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
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

public class WineVintageServiceAuthorizationTests
{
    private static WineVintage CreateVintage(int id, int wineId, int uploadedByUserId, ApprovalStatus status = ApprovalStatus.Pending) =>
        new()
        {
            Id = id,
            WineId = wineId,
            Year = 2020,
            AlcoholContent = 14.0m,
            ServingTemperature = 16,
            ApprovalStatus = status,
            UploadedByUserId = uploadedByUserId,
            RegisterDate = DateTime.UtcNow
        };

    private static Wine CreateWine(int id, int? wineryId) =>
        new()
        {
            Id = id,
            WineryId = wineryId,
            Name = "Vino Test",
            WineType = WineType.Red,
            SourceType = wineryId.HasValue ? SourceType.Official : SourceType.Community
        };

    private static Winery CreateWinery(int id, int? userId, WineryStatus status = WineryStatus.Approved) =>
        new()
        {
            Id = id,
            Name = "Bodega Test",
            LocationId = 1,
            UserId = userId,
            Status = status,
            RegisterDate = DateTime.UtcNow
        };

    private static UpdateWineVintageRequestDto CreateUpdateDto() =>
        new(Year: 2020, AlcoholContent: 14.5m);

    [Fact]
    public async Task UpdateAsync_Uploader_PendingVintage_Succeeds()
    {
        // Arrange
        var vintage = CreateVintage(id: 101, wineId: 1, uploadedByUserId: 10, status: ApprovalStatus.Pending);
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetByIdAsync(101, Arg.Any<CancellationToken>()).Returns(vintage);
        vintageRepo.UpdateAsync(Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineVintageService(vintageRepo, Substitute.For<IWineRepository>(), Substitute.For<IGrapeRepository>(), Substitute.For<IWineryRepository>());
        var actor = new Actor(10, AppRoles.User);

        // Act
        var result = await service.UpdateAsync(1, 101, CreateUpdateDto(), actor);

        // Assert
        Assert.NotNull(result);
        await vintageRepo.Received(1).UpdateAsync(Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAsync_Uploader_ApprovedVintage_ThrowsForbiddenException_WithModeratedMessage()
    {
        // Arrange
        var vintage = CreateVintage(id: 101, wineId: 1, uploadedByUserId: 10, status: ApprovalStatus.Approved);
        var wine = CreateWine(id: 1, wineryId: 5);
        var winery = CreateWinery(id: 5, userId: 99); // Dueño es otro usuario (99)

        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetByIdAsync(101, Arg.Any<CancellationToken>()).Returns(vintage);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(5, Arg.Any<CancellationToken>()).Returns(winery);

        var service = new WineVintageService(vintageRepo, wineRepo, Substitute.For<IGrapeRepository>(), wineryRepo);
        var actor = new Actor(10, AppRoles.User);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateAsync(1, 101, CreateUpdateDto(), actor));

        Assert.Equal("No podés editar una cosecha que ya fue moderada.", ex.Message);
        await vintageRepo.DidNotReceiveWithAnyArgs().UpdateAsync(default!, default!, default);
    }

    [Fact]
    public async Task UpdateAsync_Uploader_RejectedVintage_ThrowsForbiddenException_WithModeratedMessage()
    {
        // Arrange
        var vintage = CreateVintage(id: 101, wineId: 1, uploadedByUserId: 10, status: ApprovalStatus.Rejected);
        var wine = CreateWine(id: 1, wineryId: 5);
        var winery = CreateWinery(id: 5, userId: 99);

        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetByIdAsync(101, Arg.Any<CancellationToken>()).Returns(vintage);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(5, Arg.Any<CancellationToken>()).Returns(winery);

        var service = new WineVintageService(vintageRepo, wineRepo, Substitute.For<IGrapeRepository>(), wineryRepo);
        var actor = new Actor(10, AppRoles.User);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateAsync(1, 101, CreateUpdateDto(), actor));

        Assert.Equal("No podés editar una cosecha que ya fue moderada.", ex.Message);
        await vintageRepo.DidNotReceiveWithAnyArgs().UpdateAsync(default!, default!, default);
    }

    [Fact]
    public async Task UpdateAsync_OtherCommonUser_ThrowsForbiddenException_WithGenericMessage()
    {
        // Arrange
        var vintage = CreateVintage(id: 101, wineId: 1, uploadedByUserId: 10, status: ApprovalStatus.Pending);
        var wine = CreateWine(id: 1, wineryId: 5);
        var winery = CreateWinery(id: 5, userId: 50);

        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetByIdAsync(101, Arg.Any<CancellationToken>()).Returns(vintage);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(5, Arg.Any<CancellationToken>()).Returns(winery);

        var service = new WineVintageService(vintageRepo, wineRepo, Substitute.For<IGrapeRepository>(), wineryRepo);
        var actor = new Actor(20, AppRoles.User); // Ni uploader ni owner

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateAsync(1, 101, CreateUpdateDto(), actor));

        Assert.Equal("No tenés permiso para editar esta cosecha.", ex.Message);
        await vintageRepo.DidNotReceiveWithAnyArgs().UpdateAsync(default!, default!, default);
    }

    [Fact]
    public async Task UpdateAsync_WineryOwner_OnApprovedVintage_Succeeds()
    {
        // Arrange
        var vintage = CreateVintage(id: 101, wineId: 1, uploadedByUserId: 10, status: ApprovalStatus.Approved);
        var wine = CreateWine(id: 1, wineryId: 5);
        var winery = CreateWinery(id: 5, userId: 50);

        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetByIdAsync(101, Arg.Any<CancellationToken>()).Returns(vintage);
        vintageRepo.UpdateAsync(Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>()).Returns(true);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(5, Arg.Any<CancellationToken>()).Returns(winery);

        var service = new WineVintageService(vintageRepo, wineRepo, Substitute.For<IGrapeRepository>(), wineryRepo);
        var actor = new Actor(50, AppRoles.Winery);

        // Act
        var result = await service.UpdateAsync(1, 101, CreateUpdateDto(), actor);

        // Assert
        Assert.NotNull(result);
        await vintageRepo.Received(1).UpdateAsync(Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAsync_OwnerOfDifferentWinery_ThrowsForbiddenException()
    {
        // Arrange
        var vintage = CreateVintage(id: 101, wineId: 1, uploadedByUserId: 10, status: ApprovalStatus.Approved);
        var wine = CreateWine(id: 1, wineryId: 5);
        var winery = CreateWinery(id: 5, userId: 50);

        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetByIdAsync(101, Arg.Any<CancellationToken>()).Returns(vintage);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(5, Arg.Any<CancellationToken>()).Returns(winery);

        var service = new WineVintageService(vintageRepo, wineRepo, Substitute.For<IGrapeRepository>(), wineryRepo);
        var actor = new Actor(60, AppRoles.Winery); // Dueño de otra bodega

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateAsync(1, 101, CreateUpdateDto(), actor));

        Assert.Equal("No tenés permiso para editar esta cosecha.", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_CommunityWine_NonUploaderUser_ThrowsForbiddenException()
    {
        // Arrange
        var vintage = CreateVintage(id: 101, wineId: 1, uploadedByUserId: 10, status: ApprovalStatus.Pending);
        var wine = CreateWine(id: 1, wineryId: null); // vino comunitario

        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetByIdAsync(101, Arg.Any<CancellationToken>()).Returns(vintage);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var service = new WineVintageService(vintageRepo, wineRepo, Substitute.For<IGrapeRepository>(), Substitute.For<IWineryRepository>());
        var actor = new Actor(20, AppRoles.User); // No es uploader

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.UpdateAsync(1, 101, CreateUpdateDto(), actor));

        Assert.Equal("No tenés permiso para editar esta cosecha.", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_Admin_AnyVintage_Succeeds()
    {
        // Arrange
        var vintage = CreateVintage(id: 101, wineId: 1, uploadedByUserId: 10, status: ApprovalStatus.Approved);
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetByIdAsync(101, Arg.Any<CancellationToken>()).Returns(vintage);
        vintageRepo.UpdateAsync(Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineVintageService(vintageRepo, Substitute.For<IWineRepository>(), Substitute.For<IGrapeRepository>(), Substitute.For<IWineryRepository>());
        var actor = new Actor(99, AppRoles.Admin);

        // Act
        var result = await service.UpdateAsync(1, 101, CreateUpdateDto(), actor);

        // Assert
        Assert.NotNull(result);
        await vintageRepo.Received(1).UpdateAsync(Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAsync_DoesNotChangeApprovalStatus()
    {
        // Arrange
        var vintage = CreateVintage(id: 101, wineId: 1, uploadedByUserId: 10, status: ApprovalStatus.Pending);
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetByIdAsync(101, Arg.Any<CancellationToken>()).Returns(vintage);
        vintageRepo.UpdateAsync(Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineVintageService(vintageRepo, Substitute.For<IWineRepository>(), Substitute.For<IGrapeRepository>(), Substitute.For<IWineryRepository>());
        var actor = new Actor(10, AppRoles.User);

        // Act
        var result = await service.UpdateAsync(1, 101, CreateUpdateDto(), actor);

        // Assert
        Assert.Equal(ApprovalStatus.Pending.ToString(), result.ApprovalStatus);
    }

    [Fact]
    public async Task UpdateAsync_VintageDoesNotBelongToWine_ThrowsNotFoundException()
    {
        // Arrange
        var vintage = CreateVintage(id: 101, wineId: 2, uploadedByUserId: 10); // pertenece al vino 2, no al 1
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetByIdAsync(101, Arg.Any<CancellationToken>()).Returns(vintage);

        var service = new WineVintageService(vintageRepo, Substitute.For<IWineRepository>(), Substitute.For<IGrapeRepository>(), Substitute.For<IWineryRepository>());
        var actor = new Actor(10, AppRoles.User);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            service.UpdateAsync(1, 101, CreateUpdateDto(), actor));

        Assert.Contains("Vintage with ID 101 not found for wine 1", ex.Message);
    }
}

