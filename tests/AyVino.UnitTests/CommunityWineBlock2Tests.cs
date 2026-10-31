using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Images.Models;
using AyVino.Api.Features.Images.Repositories;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AyVino.UnitTests;

public class CommunityWineBlock2Tests
{
    private readonly IImageTransactionRunner _transactionRunner = Substitute.For<IImageTransactionRunner>();
    private readonly IImageStorage _imageStorage = Substitute.For<IImageStorage>();
    private readonly IImageRepository _imageRepository = Substitute.For<IImageRepository>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IWineryRepository _wineryRepository = Substitute.For<IWineryRepository>();
    private readonly IWineRepository _wineRepository = Substitute.For<IWineRepository>();
    private readonly IWineVintageRepository _vintageRepository = Substitute.For<IWineVintageRepository>();
    private readonly IUserVintageImageRepository _userVintageImageRepository = Substitute.For<IUserVintageImageRepository>();
    private readonly ILogger<ImageOrchestrator> _logger = Substitute.For<ILogger<ImageOrchestrator>>();

    private readonly ImageOrchestrator _sut;

    public CommunityWineBlock2Tests()
    {
        _sut = new ImageOrchestrator(
            _transactionRunner,
            _imageStorage,
            _imageRepository,
            _userRepository,
            _wineryRepository,
            _wineRepository,
            _vintageRepository,
            _logger,
            _userVintageImageRepository);
    }

    private static IFormFile CreateValidJpegFile()
    {
        // Valid JPEG header bytes: FF D8 FF E0 ...
        var bytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01 };
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", "test.jpg")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/jpeg"
        };
    }

    [Fact]
    public async Task UploadUserVintageImageAsync_FirstPhotoRule_WhenUploaderAndVintageImageNull_SetsVintageImage()
    {
        // Arrange
        var wine = new Wine { Id = 10, Name = "Vino Test" };
        var vintage = new WineVintage
        {
            Id = 20,
            WineId = 10,
            Year = 2021,
            UploadedByUserId = 100, // Actor is the uploader
            ApprovalStatus = ApprovalStatus.Pending,
            ImageId = null // Vintage has no image yet
        };

        _wineRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepository.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);
        _userVintageImageRepository.GetImageIdAsync(100, 20, Arg.Any<CancellationToken>()).Returns((Guid?)null);

        var uploadResult = new StoredImageResult("user-vintages/photo1", 2048, 600, 800);
        _imageStorage.UploadAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), "image/jpeg", ImageType.UserVintage, Arg.Any<CancellationToken>())
            .Returns(uploadResult);

        var actor = new Actor(100, AppRoles.User);
        var file = CreateValidJpegFile();

        // Act
        var resultId = await _sut.UploadUserVintageImageAsync(10, 20, file, actor);

        // Assert: setAsVintageImage must be TRUE
        Assert.NotEqual(Guid.Empty, resultId);
        await _transactionRunner.Received(1).AttachUserVintageImageAsync(
            Arg.Is<Image>(img => img.Id == resultId && img.ExternalId == "user-vintages/photo1"),
            100,
            20,
            true, // setAsVintageImage
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UploadUserVintageImageAsync_FirstPhotoRule_WhenNotUploader_DoesNotSetVintageImage()
    {
        // Arrange
        var wine = new Wine { Id = 10, Name = "Vino Test" };
        var vintage = new WineVintage
        {
            Id = 20,
            WineId = 10,
            Year = 2021,
            UploadedByUserId = 999, // Another user is uploader
            ApprovalStatus = ApprovalStatus.Pending,
            ImageId = null // Vintage has no image
        };

        _wineRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepository.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);
        _userVintageImageRepository.GetImageIdAsync(100, 20, Arg.Any<CancellationToken>()).Returns((Guid?)null);

        var uploadResult = new StoredImageResult("user-vintages/photo2", 2048, 600, 800);
        _imageStorage.UploadAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), "image/jpeg", ImageType.UserVintage, Arg.Any<CancellationToken>())
            .Returns(uploadResult);

        var actor = new Actor(100, AppRoles.User);
        var file = CreateValidJpegFile();

        // Act
        var resultId = await _sut.UploadUserVintageImageAsync(10, 20, file, actor);

        // Assert: setAsVintageImage must be FALSE
        Assert.NotEqual(Guid.Empty, resultId);
        await _transactionRunner.Received(1).AttachUserVintageImageAsync(
            Arg.Is<Image>(img => img.Id == resultId),
            100,
            20,
            false, // setAsVintageImage is FALSE
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UploadUserVintageImageAsync_WhenVintageAlreadyHasImage_DoesNotSetVintageImage()
    {
        // Arrange
        var wine = new Wine { Id = 10, Name = "Vino Test" };
        var vintage = new WineVintage
        {
            Id = 20,
            WineId = 10,
            Year = 2021,
            UploadedByUserId = 100, // Actor is uploader
            ApprovalStatus = ApprovalStatus.Pending,
            ImageId = Guid.NewGuid() // Already has an official image
        };

        _wineRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepository.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);

        var uploadResult = new StoredImageResult("user-vintages/photo3", 2048, 600, 800);
        _imageStorage.UploadAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), "image/jpeg", ImageType.UserVintage, Arg.Any<CancellationToken>())
            .Returns(uploadResult);

        var actor = new Actor(100, AppRoles.User);
        var file = CreateValidJpegFile();

        // Act
        await _sut.UploadUserVintageImageAsync(10, 20, file, actor);

        // Assert: setAsVintageImage must be FALSE
        await _transactionRunner.Received(1).AttachUserVintageImageAsync(
            Arg.Any<Image>(),
            100,
            20,
            false,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UploadUserVintageImageAsync_ReplaceExisting_PurgesOldIfUnreferenced()
    {
        // Arrange
        var oldImageId = Guid.NewGuid();
        var wine = new Wine { Id = 10, Name = "Vino Test" };
        var vintage = new WineVintage
        {
            Id = 20,
            WineId = 10,
            Year = 2021,
            UploadedByUserId = 100,
            ApprovalStatus = ApprovalStatus.Pending,
            ImageId = Guid.NewGuid()
        };

        _wineRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepository.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);
        _userVintageImageRepository.GetImageIdAsync(100, 20, Arg.Any<CancellationToken>()).Returns(oldImageId);

        var oldImage = new Image { Id = oldImageId, ExternalId = "old_user_photo_ext" };
        _imageRepository.GetByIdAsync(oldImageId, Arg.Any<CancellationToken>()).Returns(oldImage);
        _imageRepository.IsReferencedAsync(oldImageId, Arg.Any<CancellationToken>()).Returns(false); // Unreferenced

        var uploadResult = new StoredImageResult("user-vintages/new_photo", 2048, 600, 800);
        _imageStorage.UploadAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), "image/jpeg", ImageType.UserVintage, Arg.Any<CancellationToken>())
            .Returns(uploadResult);

        var actor = new Actor(100, AppRoles.User);
        var file = CreateValidJpegFile();

        // Act
        await _sut.UploadUserVintageImageAsync(10, 20, file, actor);

        // Assert: old unreferenced image is deleted
        await _imageRepository.Received(1).DeleteAsync(oldImageId, Arg.Any<CancellationToken>());
        await _imageStorage.Received(1).DeleteAsync("old_user_photo_ext", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UploadUserVintageImageAsync_ReplaceExisting_DoesNotDeleteIfReferenced()
    {
        // Arrange
        var oldImageId = Guid.NewGuid();
        var wine = new Wine { Id = 10, Name = "Vino Test" };
        var vintage = new WineVintage
        {
            Id = 20,
            WineId = 10,
            Year = 2021,
            UploadedByUserId = 100,
            ApprovalStatus = ApprovalStatus.Pending,
            ImageId = oldImageId // Vintage also references this image!
        };

        _wineRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepository.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);
        _userVintageImageRepository.GetImageIdAsync(100, 20, Arg.Any<CancellationToken>()).Returns(oldImageId);

        var oldImage = new Image { Id = oldImageId, ExternalId = "shared_photo_ext" };
        _imageRepository.GetByIdAsync(oldImageId, Arg.Any<CancellationToken>()).Returns(oldImage);
        _imageRepository.IsReferencedAsync(oldImageId, Arg.Any<CancellationToken>()).Returns(true); // Still referenced!

        var uploadResult = new StoredImageResult("user-vintages/new_photo", 2048, 600, 800);
        _imageStorage.UploadAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), "image/jpeg", ImageType.UserVintage, Arg.Any<CancellationToken>())
            .Returns(uploadResult);

        var actor = new Actor(100, AppRoles.User);
        var file = CreateValidJpegFile();

        // Act
        await _sut.UploadUserVintageImageAsync(10, 20, file, actor);

        // Assert: old referenced image must NOT be deleted
        await _imageRepository.DidNotReceiveWithAnyArgs().DeleteAsync(oldImageId, Arg.Any<CancellationToken>());
        await _imageStorage.DidNotReceive().DeleteAsync("shared_photo_ext", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteUserVintageImageAsync_WhenReferencedByVintage_KeepsImage()
    {
        // Arrange
        var imageId = Guid.NewGuid();
        var wine = new Wine { Id = 10, Name = "Vino Test" };
        var vintage = new WineVintage
        {
            Id = 20,
            WineId = 10,
            Year = 2021,
            UploadedByUserId = 100,
            ApprovalStatus = ApprovalStatus.Pending,
            ImageId = imageId // Vintage references this image
        };

        _wineRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepository.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);
        _userVintageImageRepository.GetImageIdAsync(100, 20, Arg.Any<CancellationToken>()).Returns(imageId);

        var image = new Image { Id = imageId, ExternalId = "shared_vintage_image" };
        _imageRepository.GetByIdAsync(imageId, Arg.Any<CancellationToken>()).Returns(image);
        _imageRepository.IsReferencedAsync(imageId, Arg.Any<CancellationToken>()).Returns(true); // Still referenced

        var actor = new Actor(100, AppRoles.User);

        // Act
        await _sut.DeleteUserVintageImageAsync(10, 20, actor);

        // Assert
        await _transactionRunner.Received(1).DetachUserVintageImageAsync(100, 20, Arg.Any<CancellationToken>());
        await _imageRepository.DidNotReceiveWithAnyArgs().DeleteAsync(imageId, Arg.Any<CancellationToken>());
        await _imageStorage.DidNotReceive().DeleteAsync("shared_vintage_image", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UploadUserVintageImageAsync_RejectedVintage_ThrowsValidationException()
    {
        // Arrange
        var wine = new Wine { Id = 10, Name = "Vino Test" };
        var vintage = new WineVintage
        {
            Id = 20,
            WineId = 10,
            Year = 2021,
            UploadedByUserId = 100,
            ApprovalStatus = ApprovalStatus.Rejected // REJECTED!
        };

        _wineRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepository.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);

        var actor = new Actor(100, AppRoles.User);
        var file = CreateValidJpegFile();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _sut.UploadUserVintageImageAsync(10, 20, file, actor));

        Assert.Contains("rechazada", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task DeleteVintageImageAsync_WhenReferencedByPersonalPhoto_DoesNotDeleteFromCloudinary()
    {
        // Arrange: Vintage public image is deleted by admin/owner, but user's personal photo still references it
        var imageId = Guid.NewGuid();
        var wine = new Wine { Id = 10, WineryId = 5, Name = "Malbec 2020", WineType = WineType.Red, LocationId = 1 };
        var vintage = new WineVintage
        {
            Id = 20,
            WineId = 10,
            Year = 2020,
            UploadedByUserId = 100,
            ApprovalStatus = ApprovalStatus.Approved,
            ImageId = imageId
        };

        _wineRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepository.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);

        var image = new Image { Id = imageId, ExternalId = "personal_shared_img" };
        _imageRepository.GetByIdAsync(imageId, Arg.Any<CancellationToken>()).Returns(image);
        _imageRepository.IsReferencedAsync(imageId, Arg.Any<CancellationToken>()).Returns(true); // Still referenced by user_vintage_images!

        var adminActor = new Actor(999, AppRoles.Admin);

        // Act
        await _sut.DeleteVintageImageAsync(10, 20, adminActor);

        // Assert: Detached from vintage, but NOT deleted from Cloudinary
        await _transactionRunner.Received(1).DetachAndDeleteVintageImageAsync(20, imageId, Arg.Any<CancellationToken>());
        await _imageStorage.DidNotReceive().DeleteAsync("personal_shared_img", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetUserVintageImageAsync_ReturnsImageId_OrNull()
    {
        // Arrange
        var imageId = Guid.NewGuid();
        var wine = new Wine { Id = 10, Name = "Vino Test" };
        var vintage = new WineVintage { Id = 20, WineId = 10, Year = 2021, ApprovalStatus = ApprovalStatus.Pending };

        _wineRepository.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepository.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);
        _userVintageImageRepository.GetImageIdAsync(100, 20, Arg.Any<CancellationToken>()).Returns(imageId);

        var actor = new Actor(100, AppRoles.User);

        // Act
        var result = await _sut.GetUserVintageImageAsync(10, 20, actor);

        // Assert
        Assert.Equal(imageId, result);
    }
}
