using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Images.Models;
using AyVino.Api.Features.Images.Repositories;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class CommunityWineBlock4Tests
{
    private readonly IWineVintageRepository _vintageRepo = Substitute.For<IWineVintageRepository>();
    private readonly IWineRepository _wineRepo = Substitute.For<IWineRepository>();
    private readonly IGrapeRepository _grapeRepo = Substitute.For<IGrapeRepository>();
    private readonly IWineryRepository _wineryRepo = Substitute.For<IWineryRepository>();
    private readonly IUserVintageImageRepository _userVintageImageRepo = Substitute.For<IUserVintageImageRepository>();
    private readonly IImageRepository _imageRepo = Substitute.For<IImageRepository>();
    private readonly IImageStorage _imageStorage = Substitute.For<IImageStorage>();

    private WineVintageService CreateService()
    {
        return new WineVintageService(
            _vintageRepo,
            _wineRepo,
            _grapeRepo,
            _wineryRepo,
            null,
            _userVintageImageRepo,
            _imageRepo,
            _imageStorage);
    }

    [Fact]
    public async Task GetPagedForAdminAsync_SortUsers_PassesUsersSortToRepository()
    {
        // Arrange
        _vintageRepo.GetPagedForAdminAsync(1, 10, (int)ApprovalStatus.Pending, "users", Arg.Any<CancellationToken>())
            .Returns([
                new AdminWineVintageListRow
                {
                    VintageId = 1,
                    WineId = 1,
                    WineName = "Malbec",
                    ApprovalStatus = ApprovalStatus.Pending,
                    CommunityUsers = 5
                }
            ]);

        var service = CreateService();

        // Act
        var result = (await service.GetPagedForAdminAsync(1, 10, "Pending", "users")).ToList();

        // Assert
        Assert.Single(result);
        Assert.Equal(5, result[0].CommunityUsers);
        await _vintageRepo.Received(1).GetPagedForAdminAsync(1, 10, (int)ApprovalStatus.Pending, "users", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetPagedForAdminAsync_InvalidSort_ThrowsValidationException()
    {
        var service = CreateService();

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.GetPagedForAdminAsync(1, 10, "Pending", "invalido"));
    }

    [Fact]
    public async Task GetContributionsAsync_ExistingVintage_ReturnsContributions()
    {
        // Arrange
        _vintageRepo.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);
        var expected = new List<VintageContributionDto>
        {
            new(UserId: 1, Username: "creator", PersonalImageId: Guid.NewGuid(), IsUploader: true),
            new(UserId: 2, Username: "drinker", PersonalImageId: null, IsUploader: false)
        };
        _vintageRepo.GetContributionsAsync(10, Arg.Any<CancellationToken>()).Returns(expected);

        var service = CreateService();

        // Act
        var result = (await service.GetContributionsAsync(10)).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.True(result[0].IsUploader);
        Assert.NotNull(result[0].PersonalImageId);
        Assert.False(result[1].IsUploader);
    }

    [Fact]
    public async Task GetContributionsAsync_NonExistentVintage_ThrowsNotFoundException()
    {
        _vintageRepo.ExistsByIdAsync(999, Arg.Any<CancellationToken>()).Returns(false);
        var service = CreateService();

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetContributionsAsync(999));
    }

    [Fact]
    public async Task PromoteImageAsync_NonAdmin_ThrowsForbiddenException()
    {
        var service = CreateService();
        var userActor = new Actor(1, AppRoles.User);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.PromoteImageAsync(10, 2, userActor));
    }

    [Fact]
    public async Task PromoteImageAsync_UserHasNoPersonalPhoto_ThrowsNotFoundException()
    {
        // Arrange
        _vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 1 });
        _userVintageImageRepo.GetImageIdAsync(2, 10, Arg.Any<CancellationToken>())
            .Returns((Guid?)null); // No personal photo!

        var service = CreateService();
        var adminActor = new Actor(999, AppRoles.Admin);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.PromoteImageAsync(10, 2, adminActor));
    }

    [Fact]
    public async Task PromoteImageAsync_WithoutPriorPublicImage_SetsVintageImage()
    {
        // Arrange
        var personalImageId = Guid.NewGuid();
        _vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 1, ImageId = null });
        _userVintageImageRepo.GetImageIdAsync(2, 10, Arg.Any<CancellationToken>())
            .Returns(personalImageId);

        var service = CreateService();
        var adminActor = new Actor(999, AppRoles.Admin);

        // Act
        var result = await service.PromoteImageAsync(10, 2, adminActor);

        // Assert
        Assert.Equal(10, result.VintageId);
        Assert.Equal(personalImageId, result.ImageId);
        await _vintageRepo.Received(1).UpdateImageIdAsync(10, personalImageId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task PromoteImageAsync_WithPriorPublicImage_ReplacesAndSafelyDeletesOldImage()
    {
        // Arrange
        var oldImageId = Guid.NewGuid();
        var personalImageId = Guid.NewGuid();

        _vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 1, ImageId = oldImageId });
        _userVintageImageRepo.GetImageIdAsync(2, 10, Arg.Any<CancellationToken>())
            .Returns(personalImageId);

        _imageRepo.IsReferencedAsync(oldImageId, Arg.Any<CancellationToken>()).Returns(false); // Unreferenced!
        var oldImage = new Image { Id = oldImageId, ExternalId = "old_public_ext" };
        _imageRepo.GetByIdAsync(oldImageId, Arg.Any<CancellationToken>()).Returns(oldImage);

        var service = CreateService();
        var adminActor = new Actor(999, AppRoles.Admin);

        // Act
        var result = await service.PromoteImageAsync(10, 2, adminActor);

        // Assert
        Assert.Equal(personalImageId, result.ImageId);
        await _vintageRepo.Received(1).UpdateImageIdAsync(10, personalImageId, Arg.Any<CancellationToken>());
        await _imageRepo.Received(1).DeleteAsync(oldImageId, Arg.Any<CancellationToken>());
        await _imageStorage.Received(1).DeleteAsync("old_public_ext", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task PromoteImageAsync_WithPriorPublicImage_KeepsOldImageIfStillReferenced()
    {
        // Arrange
        var oldImageId = Guid.NewGuid();
        var personalImageId = Guid.NewGuid();

        _vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 1, ImageId = oldImageId });
        _userVintageImageRepo.GetImageIdAsync(2, 10, Arg.Any<CancellationToken>())
            .Returns(personalImageId);

        _imageRepo.IsReferencedAsync(oldImageId, Arg.Any<CancellationToken>()).Returns(true); // Still referenced by another entity/photo!

        var service = CreateService();
        var adminActor = new Actor(999, AppRoles.Admin);

        // Act
        await service.PromoteImageAsync(10, 2, adminActor);

        // Assert
        await _vintageRepo.Received(1).UpdateImageIdAsync(10, personalImageId, Arg.Any<CancellationToken>());
        await _imageRepo.DidNotReceiveWithAnyArgs().DeleteAsync(oldImageId, Arg.Any<CancellationToken>());
        await _imageStorage.DidNotReceiveWithAnyArgs().DeleteAsync(default!, default);
    }

    [Fact]
    public async Task Invariant_AdminPromoteImage_DoesNotDeleteOrModify_UserVintageImages()
    {
        // Arrange
        var personalImageId = Guid.NewGuid();
        _vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 1, ImageId = null });
        _userVintageImageRepo.GetImageIdAsync(2, 10, Arg.Any<CancellationToken>())
            .Returns(personalImageId);

        var service = CreateService();
        var adminActor = new Actor(999, AppRoles.Admin);

        // Act
        await service.PromoteImageAsync(10, 2, adminActor);

        // Assert: userVintageImageRepo.DeleteAsync is NEVER called by Admin promote
        await _userVintageImageRepo.DidNotReceiveWithAnyArgs().DeleteAsync(default, default, default!);
    }
}
