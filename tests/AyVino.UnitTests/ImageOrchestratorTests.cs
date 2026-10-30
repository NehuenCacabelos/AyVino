using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Images.Models;
using AyVino.Api.Features.Images.Repositories;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Users.Models;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace AyVino.UnitTests;

public class ImageOrchestratorTests
{
    private readonly IImageTransactionRunner _transactionRunner = Substitute.For<IImageTransactionRunner>();
    private readonly IImageStorage _imageStorage = Substitute.For<IImageStorage>();
    private readonly IImageRepository _imageRepository = Substitute.For<IImageRepository>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IWineryRepository _wineryRepository = Substitute.For<IWineryRepository>();
    private readonly IWineRepository _wineRepository = Substitute.For<IWineRepository>();
    private readonly IWineVintageRepository _vintageRepository = Substitute.For<IWineVintageRepository>();
    private readonly ILogger<ImageOrchestrator> _logger = Substitute.For<ILogger<ImageOrchestrator>>();

    private readonly ImageOrchestrator _sut;

    public ImageOrchestratorTests()
    {
        _sut = new ImageOrchestrator(
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
        file.FileName.Returns("avatar.jpg");
        file.ContentType.Returns("image/jpeg");
        file.OpenReadStream().Returns(_ => new MemoryStream(content));
        return file;
    }

    [Fact]
    public async Task UploadAvatarAsync_ValidFileWithPreviousAvatar_UploadsNewAttachesAndDeletesOld()
    {
        // Arrange
        var oldImageId = Guid.NewGuid();
        var user = new User { Id = 10, Username = "testuser", AvatarImageId = oldImageId };
        _userRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(user);

        var uploadResult = new StoredImageResult("ayvino/avatars/new_ext_id", 1024, 200, 200);
        _imageStorage.UploadAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), "image/jpeg", ImageType.Avatar, Arg.Any<CancellationToken>())
            .Returns(uploadResult);

        var oldImage = new Image { Id = oldImageId, ExternalId = "ayvino/avatars/old_ext_id" };
        _imageRepository.GetByIdAsync(oldImageId, Arg.Any<CancellationToken>()).Returns(oldImage);

        var file = CreateValidJpegFile();

        // Act
        var resultId = await _sut.UploadAvatarAsync(10, file);

        // Assert
        Assert.NotEqual(Guid.Empty, resultId);
        await _transactionRunner.Received(1).AttachAvatarAsync(
            Arg.Is<Image>(img => img.Id == resultId && img.ExternalId == uploadResult.ExternalId),
            10,
            Arg.Any<CancellationToken>());

        // Old image should be cleaned up
        await _imageRepository.Received(1).DeleteAsync(oldImageId, Arg.Any<CancellationToken>());
        await _imageStorage.Received(1).DeleteAsync("ayvino/avatars/old_ext_id", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UploadAvatarAsync_WhenDbFails_CompensatesByDeletingFromCloudinary()
    {
        // Arrange
        var user = new User { Id = 10, Username = "testuser", AvatarImageId = null };
        _userRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(user);

        var uploadResult = new StoredImageResult("ayvino/avatars/orphan_id", 1024, 200, 200);
        _imageStorage.UploadAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), "image/jpeg", ImageType.Avatar, Arg.Any<CancellationToken>())
            .Returns(uploadResult);

        _transactionRunner.AttachAvatarAsync(Arg.Any<Image>(), 10, Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("DB connection error"));

        var file = CreateValidJpegFile();

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.UploadAvatarAsync(10, file));

        // Must compensate
        await _imageStorage.Received(1).DeleteAsync("ayvino/avatars/orphan_id", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteAvatarAsync_WhenAvatarExists_DetachesAndDeletesFromCloudinary()
    {
        // Arrange
        var imageId = Guid.NewGuid();
        var user = new User { Id = 10, Username = "testuser", AvatarImageId = imageId };
        _userRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(user);

        var image = new Image { Id = imageId, ExternalId = "ayvino/avatars/my_avatar" };
        _imageRepository.GetByIdAsync(imageId, Arg.Any<CancellationToken>()).Returns(image);

        // Act
        await _sut.DeleteAvatarAsync(10);

        // Assert
        await _transactionRunner.Received(1).DetachAndDeleteAvatarAsync(10, imageId, Arg.Any<CancellationToken>());
        await _imageStorage.Received(1).DeleteAsync("ayvino/avatars/my_avatar", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteAvatarAsync_WhenNoAvatar_IsIdempotent()
    {
        // Arrange
        var user = new User { Id = 10, Username = "testuser", AvatarImageId = null };
        _userRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(user);

        // Act
        await _sut.DeleteAvatarAsync(10);

        // Assert
        await _transactionRunner.DidNotReceiveWithAnyArgs().DetachAndDeleteAvatarAsync(default, default, default);
        await _imageStorage.DidNotReceiveWithAnyArgs().DeleteAsync(default!, default);
    }

    [Fact]
    public async Task UploadWineryLogoAsync_WhenUserIsNotOwner_ThrowsForbiddenException()
    {
        // Arrange
        var winery = new Winery { Id = 5, Name = "Catena", UserId = 100, Status = WineryStatus.Approved };
        _wineryRepository.GetByIdAsync(5, Arg.Any<CancellationToken>()).Returns(winery);

        var differentUserActor = new Actor(UserId: 200, Role: AppRoles.Winery);
        var file = CreateValidJpegFile();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() => _sut.UploadWineryLogoAsync(5, file, differentUserActor));
        Assert.Contains("permisos", ex.Message, StringComparison.OrdinalIgnoreCase);

        // Cloudinary upload never triggered
        await _imageStorage.DidNotReceiveWithAnyArgs().UploadAsync(default, default!, default!, default, default);
    }

    [Fact]
    public async Task UploadWineryLogoAsync_WhenUserIsAdmin_SucceedsEvenIfNotOwner()
    {
        // Arrange
        var winery = new Winery { Id = 5, Name = "Catena", UserId = 100, Status = WineryStatus.Approved };
        _wineryRepository.GetByIdAsync(5, Arg.Any<CancellationToken>()).Returns(winery);

        var adminActor = new Actor(UserId: 999, Role: AppRoles.Admin);
        var uploadResult = new StoredImageResult("ayvino/wineries/logos/logo_1", 2048, 400, 400);
        _imageStorage.UploadAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), "image/jpeg", ImageType.WineryLogo, Arg.Any<CancellationToken>())
            .Returns(uploadResult);

        var file = CreateValidJpegFile();

        // Act
        var resultId = await _sut.UploadWineryLogoAsync(5, file, adminActor);

        // Assert
        Assert.NotEqual(Guid.Empty, resultId);
        await _transactionRunner.Received(1).AttachWineryLogoAsync(
            Arg.Is<Image>(img => img.Id == resultId && img.ExternalId == uploadResult.ExternalId),
            5,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UploadWineryBannerAsync_WhenUserIsNotOwner_ThrowsForbiddenException()
    {
        // Arrange
        var winery = new Winery { Id = 5, Name = "Catena", UserId = 100, Status = WineryStatus.Approved };
        _wineryRepository.GetByIdAsync(5, Arg.Any<CancellationToken>()).Returns(winery);

        var unauthorizedActor = new Actor(UserId: 200, Role: AppRoles.Winery);
        var file = CreateValidJpegFile();

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() => _sut.UploadWineryBannerAsync(5, file, unauthorizedActor));
        await _imageStorage.DidNotReceiveWithAnyArgs().UploadAsync(default, default!, default!, default, default);
    }

    [Fact]
    public async Task DeleteWineryLogoAsync_WhenOwner_DetachesAndDeletesFromCloudinary()
    {
        // Arrange
        var logoId = Guid.NewGuid();
        var winery = new Winery { Id = 5, Name = "Catena", UserId = 100, Status = WineryStatus.Approved, LogoImageId = logoId };
        _wineryRepository.GetByIdAsync(5, Arg.Any<CancellationToken>()).Returns(winery);

        var image = new Image { Id = logoId, ExternalId = "ayvino/wineries/logos/catena_logo" };
        _imageRepository.GetByIdAsync(logoId, Arg.Any<CancellationToken>()).Returns(image);

        var ownerActor = new Actor(UserId: 100, Role: AppRoles.Winery);

        // Act
        await _sut.DeleteWineryLogoAsync(5, ownerActor);

        // Assert
        await _transactionRunner.Received(1).DetachAndDeleteWineryLogoAsync(5, logoId, Arg.Any<CancellationToken>());
        await _imageStorage.Received(1).DeleteAsync("ayvino/wineries/logos/catena_logo", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UploadVintageImageAsync_WhenActorHasNoPermission_ThrowsForbiddenException()
    {
        // Arrange
        var wine = new Wine { Id = 10, WineryId = 5, Name = "Malbec 2020", WineType = WineType.Red, LocationId = 1 };
        var vintage = new WineVintage { Id = 20, WineId = 10, Year = 2020, UploadedByUserId = 100, ApprovalStatus = ApprovalStatus.Approved };
        _wineRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepository.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);

        var winery = new Winery { Id = 5, Name = "Bodega A", UserId = 50, Status = WineryStatus.Approved };
        _wineryRepository.GetByIdAsync(5, Arg.Any<CancellationToken>()).Returns(winery);

        // Actor 200 is neither winery owner (50) nor admin, and vintage is already approved (uploader can only edit while pending)
        var unauthorizedActor = new Actor(UserId: 200, Role: AppRoles.Winery);
        var file = CreateValidJpegFile();

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() => _sut.UploadVintageImageAsync(10, 20, file, unauthorizedActor));
        await _imageStorage.DidNotReceiveWithAnyArgs().UploadAsync(default, default!, default!, default, default);
    }

    [Fact]
    public async Task UploadVintageImageAsync_WhenWineryOwner_UploadsSuccessfully()
    {
        // Arrange
        var wine = new Wine { Id = 10, WineryId = 5, Name = "Malbec 2020", WineType = WineType.Red, LocationId = 1 };
        var vintage = new WineVintage { Id = 20, WineId = 10, Year = 2020, UploadedByUserId = 100, ApprovalStatus = ApprovalStatus.Approved };
        _wineRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepository.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);

        var winery = new Winery { Id = 5, Name = "Bodega A", UserId = 50, Status = WineryStatus.Approved };
        _wineryRepository.GetByIdAsync(5, Arg.Any<CancellationToken>()).Returns(winery);

        var ownerActor = new Actor(UserId: 50, Role: AppRoles.Winery);

        var uploadResult = new StoredImageResult("ayvino/vintages/v20_bottle", 3000, 600, 1200);
        _imageStorage.UploadAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), "image/jpeg", ImageType.WineVintage, Arg.Any<CancellationToken>())
            .Returns(uploadResult);

        var file = CreateValidJpegFile();

        // Act
        var resultId = await _sut.UploadVintageImageAsync(10, 20, file, ownerActor);

        // Assert
        Assert.NotEqual(Guid.Empty, resultId);
        await _transactionRunner.Received(1).AttachVintageImageAsync(
            Arg.Is<Image>(img => img.Id == resultId && img.ExternalId == uploadResult.ExternalId),
            20,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteVintageImageAsync_WhenVintageHasNoImage_IsIdempotent()
    {
        // Arrange
        var wine = new Wine { Id = 10, WineryId = 5, Name = "Malbec 2020", WineType = WineType.Red, LocationId = 1 };
        var vintage = new WineVintage { Id = 20, WineId = 10, Year = 2020, UploadedByUserId = 100, ApprovalStatus = ApprovalStatus.Pending, ImageId = null };
        _wineRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepository.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);

        var uploaderActor = new Actor(UserId: 100, Role: AppRoles.User);

        // Act
        await _sut.DeleteVintageImageAsync(10, 20, uploaderActor);

        // Assert
        await _transactionRunner.DidNotReceiveWithAnyArgs().DetachAndDeleteVintageImageAsync(default, default, default);
        await _imageStorage.DidNotReceiveWithAnyArgs().DeleteAsync(default!, default);
    }

    [Fact]
    public async Task UploadAvatarAsync_UserNotFound_ThrowsNotFoundException()
    {
        _userRepository.GetByIdAsync(999, Arg.Any<CancellationToken>()).Returns((User?)null);
        var file = CreateValidJpegFile();

        await Assert.ThrowsAsync<NotFoundException>(() => _sut.UploadAvatarAsync(999, file));
    }

    [Fact]
    public async Task UploadWineryLogoAsync_WineryNotFound_ThrowsNotFoundException()
    {
        _wineryRepository.GetByIdAsync(999, Arg.Any<CancellationToken>()).Returns((Winery?)null);
        var file = CreateValidJpegFile();
        var actor = new Actor(1, AppRoles.Admin);

        await Assert.ThrowsAsync<NotFoundException>(() => _sut.UploadWineryLogoAsync(999, file, actor));
    }

    [Fact]
    public async Task UploadVintageImageAsync_WhenAdmin_SucceedsEvenIfNotOwner()
    {
        var wine = new Wine { Id = 10, WineryId = 5, Name = "Malbec 2020", WineType = WineType.Red, LocationId = 1 };
        var vintage = new WineVintage { Id = 20, WineId = 10, Year = 2020, UploadedByUserId = 100, ApprovalStatus = ApprovalStatus.Approved };
        _wineRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepository.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);

        var adminActor = new Actor(UserId: 999, Role: AppRoles.Admin);

        var uploadResult = new StoredImageResult("ayvino/vintages/v20_bottle", 3000, 600, 1200);
        _imageStorage.UploadAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), "image/jpeg", ImageType.WineVintage, Arg.Any<CancellationToken>())
            .Returns(uploadResult);

        var file = CreateValidJpegFile();

        var resultId = await _sut.UploadVintageImageAsync(10, 20, file, adminActor);

        Assert.NotEqual(Guid.Empty, resultId);
        await _transactionRunner.Received(1).AttachVintageImageAsync(
            Arg.Is<Image>(img => img.Id == resultId && img.ExternalId == uploadResult.ExternalId),
            20,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UploadVintageImageAsync_WhenDbFails_CompensatesByDeletingFromCloudinary()
    {
        var wine = new Wine { Id = 10, WineryId = 5, Name = "Malbec 2020", WineType = WineType.Red, LocationId = 1 };
        var vintage = new WineVintage { Id = 20, WineId = 10, Year = 2020, UploadedByUserId = 100, ApprovalStatus = ApprovalStatus.Approved };
        _wineRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepository.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);

        var adminActor = new Actor(UserId: 999, Role: AppRoles.Admin);

        var uploadResult = new StoredImageResult("ayvino/vintages/compensate_bottle", 3000, 600, 1200);
        _imageStorage.UploadAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), "image/jpeg", ImageType.WineVintage, Arg.Any<CancellationToken>())
            .Returns(uploadResult);

        _transactionRunner.AttachVintageImageAsync(Arg.Any<Image>(), 20, Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("DB failed"));

        var file = CreateValidJpegFile();

        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.UploadVintageImageAsync(10, 20, file, adminActor));

        await _imageStorage.Received(1).DeleteAsync("ayvino/vintages/compensate_bottle", Arg.Any<CancellationToken>());
    }
}
