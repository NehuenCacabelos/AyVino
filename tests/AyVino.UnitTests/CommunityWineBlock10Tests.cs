using System.Data;
using System.IO;
using System.Security.Claims;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Images.Models;
using AyVino.Api.Features.Images.Repositories;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AyVino.UnitTests;

public class CommunityWineBlock10Tests
{
    private readonly IWineVintageRepository _vintageRepo = Substitute.For<IWineVintageRepository>();
    private readonly IWineRepository _wineRepo = Substitute.For<IWineRepository>();
    private readonly IWineryRepository _wineryRepo = Substitute.For<IWineryRepository>();
    private readonly IGrapeRepository _grapeRepo = Substitute.For<IGrapeRepository>();
    private readonly ILocationRepository _locationRepo = Substitute.For<ILocationRepository>();
    private readonly IImageTransactionRunner _imageTxRunner = Substitute.For<IImageTransactionRunner>();
    private readonly IImageStorage _imageStorage = Substitute.For<IImageStorage>();
    private readonly IImageRepository _imageRepo = Substitute.For<IImageRepository>();
    private readonly IUserRepository _userRepo = Substitute.For<IUserRepository>();
    private readonly IUserVintageImageRepository _userVintageImageRepo = Substitute.For<IUserVintageImageRepository>();
    private readonly ILogger<ImageOrchestrator> _logger = Substitute.For<ILogger<ImageOrchestrator>>();

    private WineVintageService CreateVintageService() =>
        new(_vintageRepo, _wineRepo, _grapeRepo, _wineryRepo);

    private WineService CreateWineService() =>
        new(_wineRepo, _wineryRepo, _locationRepo, _grapeRepo, _vintageRepo);

    private ImageOrchestrator CreateImageOrchestrator() =>
        new(_imageTxRunner, _imageStorage, _imageRepo, _userRepo, _wineryRepo, _wineRepo, _vintageRepo, _logger, _userVintageImageRepo);

    private static IFormFile CreateValidJpegFile()
    {
        var bytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01 };
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", "photo.jpg")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/jpeg"
        };
    }

    // ==========================================
    // 1. WineVintageService.DeleteAsync checks
    // ==========================================

    [Fact]
    public async Task WineVintage_DeleteAsync_WithOnlyOtherUserPersonalImage_ThrowsConflictException()
    {
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 10, UploadedByUserId = 42 });
        _vintageRepo.GetUsageCountsAsync(100).Returns(new WineVintageUsageCounts(
            ReviewCount: 0, CellarItemCount: 0, OtherUserImagesCount: 1, OtherUserActivitiesCount: 0));
        var sut = CreateVintageService();

        var ex = await Assert.ThrowsAsync<ConflictException>(() => sut.DeleteAsync(wineId: 10, vintageId: 100));

        Assert.Contains("fotos: 1", ex.Message);
        Assert.Contains("Podés rechazarla en lugar de eliminarla para preservar el historial.", ex.Message);
        await _vintageRepo.DidNotReceive().DeleteAsync(Arg.Any<int>());
    }

    [Fact]
    public async Task WineVintage_DeleteAsync_WithOnlyOtherUserDirectUncork_ThrowsConflictException()
    {
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 10, UploadedByUserId = 42 });
        _vintageRepo.GetUsageCountsAsync(100).Returns(new WineVintageUsageCounts(
            ReviewCount: 0, CellarItemCount: 0, OtherUserImagesCount: 0, OtherUserActivitiesCount: 1));
        var sut = CreateVintageService();

        var ex = await Assert.ThrowsAsync<ConflictException>(() => sut.DeleteAsync(wineId: 10, vintageId: 100));

        Assert.Contains("actividades: 1", ex.Message);
        Assert.Contains("Podés rechazarla en lugar de eliminarla para preservar el historial.", ex.Message);
        await _vintageRepo.DidNotReceive().DeleteAsync(Arg.Any<int>());
    }

    [Fact]
    public async Task WineVintage_DeleteAsync_WithOnlyWineContributedOfOwnUploader_AllowsDeletion()
    {
        // El uploader es 42 y la única actividad es WineContributed del propio uploader, por lo que OtherUser* = 0
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 10, UploadedByUserId = 42 });
        _vintageRepo.GetUsageCountsAsync(100).Returns(new WineVintageUsageCounts(
            ReviewCount: 0, CellarItemCount: 0, OtherUserImagesCount: 0, OtherUserActivitiesCount: 0));
        _vintageRepo.DeleteAsync(100).Returns(true);
        var sut = CreateVintageService();

        await sut.DeleteAsync(wineId: 10, vintageId: 100);

        await _vintageRepo.Received(1).DeleteAsync(100);
    }

    [Fact]
    public async Task WineVintage_DeleteAsync_WithCombinations_ThrowsConflictException()
    {
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 10, UploadedByUserId = 42 });
        _vintageRepo.GetUsageCountsAsync(100).Returns(new WineVintageUsageCounts(
            ReviewCount: 2, CellarItemCount: 1, OtherUserImagesCount: 3, OtherUserActivitiesCount: 4));
        var sut = CreateVintageService();

        var ex = await Assert.ThrowsAsync<ConflictException>(() => sut.DeleteAsync(wineId: 10, vintageId: 100));

        Assert.Contains("reseñas: 2", ex.Message);
        Assert.Contains("cava: 1", ex.Message);
        Assert.Contains("fotos: 3", ex.Message);
        Assert.Contains("actividades: 4", ex.Message);
        Assert.Contains("Podés rechazarla en lugar de eliminarla para preservar el historial.", ex.Message);
        await _vintageRepo.DidNotReceive().DeleteAsync(Arg.Any<int>());
    }

    // ==========================================
    // 2. WineService.DeleteAsync checks
    // ==========================================

    [Fact]
    public async Task Wine_DeleteAsync_WithOnlyOtherUserPersonalImage_ThrowsConflictException()
    {
        _wineRepo.ExistsByIdAsync(42).Returns(true);
        _wineRepo.GetUsageCountsAsync(42).Returns(new WineUsageCounts(
            DuplicateWinesCount: 0, ReviewCount: 0, UserWineCount: 0, CellarItemCount: 0,
            OtherUserImagesCount: 1, OtherUserActivitiesCount: 0));
        var sut = CreateWineService();

        var ex = await Assert.ThrowsAsync<ConflictException>(() => sut.DeleteAsync(42));

        Assert.Contains("fotos: 1", ex.Message);
        Assert.Contains("Si es un duplicado, usá la fusión o rechazá sus cosechas para preservar el historial.", ex.Message);
        await _wineRepo.DidNotReceive().DeleteAsync(Arg.Any<int>());
    }

    [Fact]
    public async Task Wine_DeleteAsync_WithOnlyOtherUserDirectUncork_ThrowsConflictException()
    {
        _wineRepo.ExistsByIdAsync(42).Returns(true);
        _wineRepo.GetUsageCountsAsync(42).Returns(new WineUsageCounts(
            DuplicateWinesCount: 0, ReviewCount: 0, UserWineCount: 0, CellarItemCount: 0,
            OtherUserImagesCount: 0, OtherUserActivitiesCount: 1));
        var sut = CreateWineService();

        var ex = await Assert.ThrowsAsync<ConflictException>(() => sut.DeleteAsync(42));

        Assert.Contains("actividades: 1", ex.Message);
        Assert.Contains("Si es un duplicado, usá la fusión o rechazá sus cosechas para preservar el historial.", ex.Message);
        await _wineRepo.DidNotReceive().DeleteAsync(Arg.Any<int>());
    }

    [Fact]
    public async Task Wine_DeleteAsync_WithOnlyWineContributedOfOwnUploader_AllowsDeletion()
    {
        _wineRepo.ExistsByIdAsync(42).Returns(true);
        _wineRepo.GetUsageCountsAsync(42).Returns(new WineUsageCounts(
            DuplicateWinesCount: 0, ReviewCount: 0, UserWineCount: 0, CellarItemCount: 0,
            OtherUserImagesCount: 0, OtherUserActivitiesCount: 0));
        _wineRepo.DeleteAsync(42).Returns(true);
        var sut = CreateWineService();

        await sut.DeleteAsync(42);

        await _wineRepo.Received(1).DeleteAsync(42);
    }

    [Fact]
    public async Task Wine_DeleteAsync_WithCombinations_ThrowsConflictException()
    {
        _wineRepo.ExistsByIdAsync(42).Returns(true);
        _wineRepo.GetUsageCountsAsync(42).Returns(new WineUsageCounts(
            DuplicateWinesCount: 1, ReviewCount: 2, UserWineCount: 1, CellarItemCount: 1,
            OtherUserImagesCount: 2, OtherUserActivitiesCount: 3));
        var sut = CreateWineService();

        var ex = await Assert.ThrowsAsync<ConflictException>(() => sut.DeleteAsync(42));

        Assert.Contains("reseñas: 2", ex.Message);
        Assert.Contains("marcas: 1", ex.Message);
        Assert.Contains("cava: 1", ex.Message);
        Assert.Contains("fotos: 2", ex.Message);
        Assert.Contains("actividades: 3", ex.Message);
        Assert.Contains("vinos duplicados asociados (1)", ex.Message);
        await _wineRepo.DidNotReceive().DeleteAsync(Arg.Any<int>());
    }

    // ==========================================
    // 3. Admin permissions & Image isolation checks
    // ==========================================

    [Fact]
    public async Task Admin_CanUpdateVintage_OfOtherUserPendingVintage()
    {
        var vintage = new WineVintage
        {
            Id = 100,
            WineId = 10,
            UploadedByUserId = 999, // Otro usuario
            ApprovalStatus = ApprovalStatus.Pending
        };
        _vintageRepo.GetByIdAsync(100).Returns(vintage);
        _vintageRepo.UpdateAsync(Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>()).Returns(true);
        _vintageRepo.GetGrapesByVintageIdAsync(100).Returns(new List<WineGrape>());
        _wineRepo.GetByIdAsync(10).Returns(new Wine { Id = 10, Name = "Vino Test" });

        var adminActor = new Actor(1, AppRoles.Admin);
        var sut = CreateVintageService();

        var request = new UpdateWineVintageRequestDto
        {
            Year = 2021,
            AlcoholContent = 13.5m,
            ServingTemperature = 16,
            AgingAdvice = "Guardar 2 años",
            Grapes = []
        };

        var result = await sut.UpdateAsync(10, 100, request, adminActor);

        Assert.NotNull(result);
        Assert.Equal(100, result.Id);
        await _vintageRepo.Received(1).UpdateAsync(Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>());
    }

    [Fact]
    public async Task Admin_CanUpdateCommunityWine()
    {
        var communityWine = new Wine
        {
            Id = 50,
            Name = "Vino Comunitario Original",
            WineryId = null,
            WineryNameText = "Bodega Casera",
            WineType = WineType.Red,
            SourceType = SourceType.Community
        };

        _wineRepo.GetByIdAsync(50).Returns(communityWine);
        _wineRepo.GetVisibleByIdAsync(50, 1, true).Returns(communityWine);
        _wineRepo.UpdateAsync(Arg.Any<Wine>()).Returns(true);

        var adminActor = new Actor(1, AppRoles.Admin);
        var sut = CreateWineService();

        var request = new UpdateWineRequestDto(
            "Vino Comunitario Actualizado",
            "Red",
            null,
            "Bodega Casera Actualizada",
            "Nueva descripción",
            null);

        var result = await sut.UpdateAsync(50, request, adminActor);

        Assert.NotNull(result);
        Assert.Equal(50, result.Id);
        await _wineRepo.Received(1).UpdateAsync(Arg.Any<Wine>());
    }

    [Fact]
    public async Task Admin_CanUploadPublicImage_OfOtherUserPendingVintage_WithoutTouchingUserVintageImages()
    {
        var wine = new Wine { Id = 10, WineryId = null };
        var vintage = new WineVintage
        {
            Id = 100,
            WineId = 10,
            UploadedByUserId = 999, // Otro usuario
            ApprovalStatus = ApprovalStatus.Pending,
            ImageId = null
        };

        _wineRepo.GetByIdAsync(10).Returns(wine);
        _vintageRepo.GetByIdAsync(100).Returns(vintage);
        _imageStorage.UploadAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<ImageType>(), Arg.Any<CancellationToken>())
            .Returns(new StoredImageResult("ext-123", 1024, 800, 600));

        var adminActor = new Actor(1, AppRoles.Admin);
        var sut = CreateImageOrchestrator();
        var file = CreateValidJpegFile();

        var imageId = await sut.UploadVintageImageAsync(10, 100, file, adminActor);

        Assert.NotEqual(Guid.Empty, imageId);
        // Verifica que se adjuntó a la cosecha
        await _imageTxRunner.Received(1).AttachVintageImageAsync(Arg.Any<Image>(), 100, Arg.Any<CancellationToken>());
        // Verifica que NUNCA se tocó user_vintage_images
        await _userVintageImageRepo.DidNotReceive().UpsertAsync(
            Arg.Any<int>(), Arg.Any<int>(), Arg.Any<Guid>(), Arg.Any<IDbConnection>(), Arg.Any<IDbTransaction>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Admin_CanDeletePublicImage_OfOtherUserPendingVintage_WithoutTouchingUserVintageImages()
    {
        var oldImageId = Guid.NewGuid();
        var wine = new Wine { Id = 10, WineryId = null };
        var vintage = new WineVintage
        {
            Id = 100,
            WineId = 10,
            UploadedByUserId = 999, // Otro usuario
            ApprovalStatus = ApprovalStatus.Pending,
            ImageId = oldImageId
        };

        _wineRepo.GetByIdAsync(10).Returns(wine);
        _vintageRepo.GetByIdAsync(100).Returns(vintage);
        _imageRepo.GetByIdAsync(oldImageId).Returns(new Image { Id = oldImageId, ExternalId = "ext-old" });
        _imageRepo.IsReferencedAsync(oldImageId).Returns(false);

        var adminActor = new Actor(1, AppRoles.Admin);
        var sut = CreateImageOrchestrator();

        await sut.DeleteVintageImageAsync(10, 100, adminActor);

        // Verifica que se desvinculó de la cosecha
        await _imageTxRunner.Received(1).DetachAndDeleteVintageImageAsync(100, oldImageId, Arg.Any<CancellationToken>());
        // Verifica que NUNCA se borró ni alteró user_vintage_images
        await _userVintageImageRepo.DidNotReceive().DeleteAsync(
            Arg.Any<int>(), Arg.Any<int>(), Arg.Any<IDbConnection>(), Arg.Any<IDbTransaction>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Wine_WithoutVisibleVintagesForActor_DoesNotAppearInSearchResultsOrListings()
    {
        // Si el repositorio no encuentra vinos con cosechas visibles para el actor, devuelve vacío
        _wineRepo.GetAllAsync(1, 10, null, null, null, null, 42, false, Arg.Any<CancellationToken>())
            .Returns(Enumerable.Empty<Wine>());
        _wineRepo.SearchAsync("Malbec", null, null, null, 1, 10, 42, false, Arg.Any<CancellationToken>())
            .Returns(Enumerable.Empty<Wine>());

        var sut = CreateWineService();
        var commonActor = new Actor(42, AppRoles.User);

        var listResult = await sut.GetAllAsync(1, 10, actor: commonActor);
        var searchResult = await sut.SearchAsync("Malbec", null, null, null, 1, 10, actor: commonActor);

        Assert.Empty(listResult);
        Assert.Empty(searchResult);
    }
}
