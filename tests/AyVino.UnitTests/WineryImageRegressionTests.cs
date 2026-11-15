using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Security;
using AyVino.Api.Common.Security.Jwt;
using AyVino.Api.Features.Images.Models;
using AyVino.Api.Features.Images.Repositories;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Locations.Services;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Users.Services;
using AyVino.Api.Features.Wineries.DTOs;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Services;
using AyVino.Api.Features.Wines.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AyVino.UnitTests;

public class WineryImageRegressionTests
{
    private readonly IImageTransactionRunner _transactionRunner = Substitute.For<IImageTransactionRunner>();
    private readonly IImageStorage _imageStorage = Substitute.For<IImageStorage>();
    private readonly IImageRepository _imageRepository = Substitute.For<IImageRepository>();
    private readonly IWineryRepository _wineryRepository = Substitute.For<IWineryRepository>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IWineRepository _wineRepository = Substitute.For<IWineRepository>();
    private readonly IWineVintageRepository _vintageRepository = Substitute.For<IWineVintageRepository>();
    private readonly ILogger<ImageOrchestrator> _logger = Substitute.For<ILogger<ImageOrchestrator>>();

    private readonly ImageOrchestrator _orchestrator;

    public WineryImageRegressionTests()
    {
        _orchestrator = new ImageOrchestrator(
            _transactionRunner,
            _imageStorage,
            _imageRepository,
            _userRepository,
            _wineryRepository,
            _wineRepository,
            _vintageRepository,
            _logger);
    }

    private static IFormFile CreateValidJpegFile()
    {
        var content = new byte[20];
        content[0] = 0xFF;
        content[1] = 0xD8;
        content[2] = 0xFF;
        var file = Substitute.For<IFormFile>();
        file.Length.Returns(content.Length);
        file.FileName.Returns("test.jpg");
        file.ContentType.Returns("image/jpeg");
        file.OpenReadStream().Returns(_ => new MemoryStream(content));
        return file;
    }

    [Fact]
    public async Task UploadWineryLogoAsync_DoesNotModifyDescriptionFoundationYearOrWebsite()
    {
        // Arrange
        const int wineryId = 42;
        var winery = new Winery
        {
            Id = wineryId,
            Name = "Bodega Zuccardi",
            Description = "Descripción original intacta",
            FoundationYear = 1963,
            Website = "https://zuccardiwines.com",
            LocationId = 3,
            Latitude = -33.5m,
            Longitude = -68.8m,
            UserId = 10,
            Status = WineryStatus.Approved,
            LogoImageId = null,
            BannerImageId = null
        };
        _wineryRepository.GetByIdAsync(wineryId, Arg.Any<CancellationToken>()).Returns(winery);

        var uploadResult = new StoredImageResult("ayvino/dev/logos-bodega/new_logo", 1024, 400, 400);
        _imageStorage.UploadAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), Arg.Any<string>(), ImageType.WineryLogo, Arg.Any<CancellationToken>())
            .Returns(uploadResult);

        var actor = new Actor(UserId: 10, Role: AppRoles.Winery);
        var file = CreateValidJpegFile();

        // Act
        await _orchestrator.UploadWineryLogoAsync(wineryId, file, actor);

        // Assert: General update on winery entity was NEVER invoked
        await _wineryRepository.DidNotReceiveWithAnyArgs().UpdateAsync(default!, default);

        // Only atomic logo attachment was triggered
        await _transactionRunner.Received(1).AttachWineryLogoAsync(
            Arg.Is<Image>(img => img.ExternalId == uploadResult.ExternalId),
            wineryId,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteWineryLogoAsync_DoesNotModifyDescriptionFoundationYearOrWebsite()
    {
        // Arrange
        const int wineryId = 42;
        var existingLogoId = Guid.NewGuid();
        var winery = new Winery
        {
            Id = wineryId,
            Name = "Bodega Zuccardi",
            Description = "Descripción original intacta",
            FoundationYear = 1963,
            Website = "https://zuccardiwines.com",
            LocationId = 3,
            Latitude = -33.5m,
            Longitude = -68.8m,
            UserId = 10,
            Status = WineryStatus.Approved,
            LogoImageId = existingLogoId
        };
        _wineryRepository.GetByIdAsync(wineryId, Arg.Any<CancellationToken>()).Returns(winery);

        var existingImage = new Image { Id = existingLogoId, ExternalId = "ayvino/dev/logos-bodega/zuccardi_logo" };
        _imageRepository.GetByIdAsync(existingLogoId, Arg.Any<CancellationToken>()).Returns(existingImage);

        var actor = new Actor(UserId: 10, Role: AppRoles.Winery);

        // Act
        await _orchestrator.DeleteWineryLogoAsync(wineryId, actor);

        // Assert: General update on winery entity was NEVER invoked
        await _wineryRepository.DidNotReceiveWithAnyArgs().UpdateAsync(default!, default);

        // Only atomic logo detachment was triggered
        await _transactionRunner.Received(1).DetachAndDeleteWineryLogoAsync(wineryId, existingLogoId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UploadWineryBannerAsync_DoesNotModifyDescriptionFoundationYearOrWebsite()
    {
        // Arrange
        const int wineryId = 42;
        var winery = new Winery
        {
            Id = wineryId,
            Name = "Bodega Zuccardi",
            Description = "Descripción original intacta",
            FoundationYear = 1963,
            Website = "https://zuccardiwines.com",
            LocationId = 3,
            Latitude = -33.5m,
            Longitude = -68.8m,
            UserId = 10,
            Status = WineryStatus.Approved,
            LogoImageId = null,
            BannerImageId = null
        };
        _wineryRepository.GetByIdAsync(wineryId, Arg.Any<CancellationToken>()).Returns(winery);

        var uploadResult = new StoredImageResult("ayvino/dev/banners-bodega/new_banner", 2048, 1920, 640);
        _imageStorage.UploadAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), Arg.Any<string>(), ImageType.WineryBanner, Arg.Any<CancellationToken>())
            .Returns(uploadResult);

        var actor = new Actor(UserId: 10, Role: AppRoles.Winery);
        var file = CreateValidJpegFile();

        // Act
        await _orchestrator.UploadWineryBannerAsync(wineryId, file, actor);

        // Assert: General update on winery entity was NEVER invoked
        await _wineryRepository.DidNotReceiveWithAnyArgs().UpdateAsync(default!, default);

        // Only atomic banner attachment was triggered
        await _transactionRunner.Received(1).AttachWineryBannerAsync(
            Arg.Is<Image>(img => img.ExternalId == uploadResult.ExternalId),
            wineryId,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteWineryBannerAsync_DoesNotModifyDescriptionFoundationYearOrWebsite()
    {
        // Arrange
        const int wineryId = 42;
        var existingBannerId = Guid.NewGuid();
        var winery = new Winery
        {
            Id = wineryId,
            Name = "Bodega Zuccardi",
            Description = "Descripción original intacta",
            FoundationYear = 1963,
            Website = "https://zuccardiwines.com",
            LocationId = 3,
            Latitude = -33.5m,
            Longitude = -68.8m,
            UserId = 10,
            Status = WineryStatus.Approved,
            BannerImageId = existingBannerId
        };
        _wineryRepository.GetByIdAsync(wineryId, Arg.Any<CancellationToken>()).Returns(winery);

        var existingImage = new Image { Id = existingBannerId, ExternalId = "ayvino/dev/banners-bodega/zuccardi_banner" };
        _imageRepository.GetByIdAsync(existingBannerId, Arg.Any<CancellationToken>()).Returns(existingImage);

        var actor = new Actor(UserId: 10, Role: AppRoles.Winery);

        // Act
        await _orchestrator.DeleteWineryBannerAsync(wineryId, actor);

        // Assert: General update on winery entity was NEVER invoked
        await _wineryRepository.DidNotReceiveWithAnyArgs().UpdateAsync(default!, default);

        // Only atomic banner detachment was triggered
        await _transactionRunner.Received(1).DetachAndDeleteWineryBannerAsync(wineryId, existingBannerId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WineryService_UpdateAsync_PreservesExistingLogoAndBannerImages()
    {
        // Arrange
        const int wineryId = 42;
        var existingLogoId = Guid.NewGuid();
        var existingBannerId = Guid.NewGuid();

        var existingWinery = new Winery
        {
            Id = wineryId,
            Name = "Bodega Antigua",
            Description = "Descripcion anterior",
            FoundationYear = 1900,
            Website = "https://antigua.com",
            LocationId = 1,
            Latitude = null,
            Longitude = null,
            UserId = 5,
            Status = WineryStatus.Approved,
            LogoImageId = existingLogoId,
            BannerImageId = existingBannerId
        };

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(wineryId, Arg.Any<CancellationToken>()).Returns(existingWinery);
        wineryRepo.UpdateAsync(Arg.Any<Winery>(), Arg.Any<CancellationToken>()).Returns(true);

        var locationRepo = Substitute.For<ILocationRepository>();
        var cityRepo = Substitute.For<ICityRepository>();
        var georefClient = Substitute.For<IGeorefClient>();
        var userService = Substitute.For<IUserService>();
        var jwtGenerator = Substitute.For<IJwtTokenGenerator>();

        var wineryService = new WineryService(wineryRepo, locationRepo, cityRepo, georefClient, userService, jwtGenerator);

        var updateDto = new UpdateWineryRequestDto(
            Name: "Bodega Renovada",
            LocationId: null,
            Description: "Nueva descripcion fresca",
            FoundationYear: 1910,
            Website: "https://renovada.com",
            Latitude: null,
            Longitude: null);

        var actor = new Actor(UserId: 5, Role: AppRoles.Winery);

        // Act
        await wineryService.UpdateAsync(wineryId, updateDto, actor);

        // Assert: update was called with the new description, year and website, BUT preserved logo and banner IDs!
        await wineryRepo.Received(1).UpdateAsync(
            Arg.Is<Winery>(w =>
                w.Id == wineryId &&
                w.Name == "Bodega Renovada" &&
                w.Description == "Nueva descripcion fresca" &&
                w.FoundationYear == 1910 &&
                w.Website == "https://renovada.com" &&
                w.LogoImageId == existingLogoId &&
                w.BannerImageId == existingBannerId),
            Arg.Any<CancellationToken>());
    }
}
