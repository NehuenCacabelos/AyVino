using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Cellars.Services;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Images.Repositories;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Reviews.DTOs;
using AyVino.Api.Features.Reviews.Models;
using AyVino.Api.Features.Reviews.Repositories;
using AyVino.Api.Features.Reviews.Services;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.Configuration;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;

namespace AyVino.UnitTests;

public class CommunityWineBlock3Tests
{
    private readonly IWineVintageRepository _vintageRepo = Substitute.For<IWineVintageRepository>();
    private readonly IWineRepository _wineRepo = Substitute.For<IWineRepository>();
    private readonly IGrapeRepository _grapeRepo = Substitute.For<IGrapeRepository>();
    private readonly IWineryRepository _wineryRepo = Substitute.For<IWineryRepository>();

    private WineVintageService CreateService(int minUsers = 2)
    {
        var options = Options.Create(new CommunityOptions { MinUsersForPublicVisibility = minUsers });
        return new WineVintageService(_vintageRepo, _wineRepo, _grapeRepo, _wineryRepo, options);
    }

    [Fact]
    public async Task GetByIdAsync_PendingVintage_1User_OtherUserReceivesNotFound()
    {
        // Arrange: Pending vintage with only 1 user (below default N=2)
        var wine = new Wine { Id = 1, WineryId = null };
        var vintage = new WineVintage
        {
            Id = 50,
            WineId = 1,
            Year = 2022,
            ApprovalStatus = ApprovalStatus.Pending,
            UploadedByUserId = 10
        };

        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepo.GetByIdAsync(50, Arg.Any<CancellationToken>()).Returns(vintage);
        _vintageRepo.IsUserParticipantAsync(50, 999, Arg.Any<CancellationToken>()).Returns(false);
        _vintageRepo.GetDistinctUserCountAsync(50, Arg.Any<CancellationToken>()).Returns(1);

        var service = CreateService(minUsers: 2);
        var unrelatedActor = new Actor(999, AppRoles.User);

        // Act & Assert: Other user receives 404
        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.GetByIdAsync(1, 50, actor: unrelatedActor));
    }

    [Fact]
    public async Task GetByIdAsync_PendingVintage_2Users_EveryoneCanSee()
    {
        // Arrange: Pending vintage with 2 distinct users (meets threshold N=2)
        var wine = new Wine { Id = 1, WineryId = null };
        var vintage = new WineVintage
        {
            Id = 50,
            WineId = 1,
            Year = 2022,
            ApprovalStatus = ApprovalStatus.Pending,
            UploadedByUserId = 10
        };

        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepo.GetByIdAsync(50, Arg.Any<CancellationToken>()).Returns(vintage);
        _vintageRepo.GetGrapesByVintageIdAsync(50, Arg.Any<CancellationToken>()).Returns([]);
        _vintageRepo.GetDistinctUserCountAsync(50, Arg.Any<CancellationToken>()).Returns(2);

        var service = CreateService(minUsers: 2);

        // Act: Anonymous user (actor null)
        var result = await service.GetByIdAsync(1, 50, actor: null);

        // Assert: Visible to everyone
        Assert.NotNull(result);
        Assert.Equal(50, result.Id);
        Assert.Equal("Pending", result.ApprovalStatus);
    }

    [Fact]
    public async Task GetByIdAsync_PendingVintage_1User_ParticipantCanSeeBeforeThreshold()
    {
        // Arrange: Pending vintage with only 1 user, but actor is a participant
        var wine = new Wine { Id = 1, WineryId = null };
        var vintage = new WineVintage
        {
            Id = 50,
            WineId = 1,
            Year = 2022,
            ApprovalStatus = ApprovalStatus.Pending,
            UploadedByUserId = 10
        };

        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepo.GetByIdAsync(50, Arg.Any<CancellationToken>()).Returns(vintage);
        _vintageRepo.GetGrapesByVintageIdAsync(50, Arg.Any<CancellationToken>()).Returns([]);
        // Actor 55 is participant (e.g. has cellar item or personal photo)
        _vintageRepo.IsUserParticipantAsync(50, 55, Arg.Any<CancellationToken>()).Returns(true);
        _vintageRepo.GetDistinctUserCountAsync(50, Arg.Any<CancellationToken>()).Returns(1);

        var service = CreateService(minUsers: 2);
        var participantActor = new Actor(55, AppRoles.User);

        // Act
        var result = await service.GetByIdAsync(1, 50, actor: participantActor);

        // Assert: Participant sees the pending vintage before threshold
        Assert.NotNull(result);
        Assert.Equal(50, result.Id);
    }

    [Fact]
    public async Task GetByIdAsync_RejectedVintage_HidesEvenWithManyUsers()
    {
        // Arrange: Rejected vintage
        var wine = new Wine { Id = 1, WineryId = null };
        var vintage = new WineVintage
        {
            Id = 50,
            WineId = 1,
            Year = 2022,
            ApprovalStatus = ApprovalStatus.Rejected,
            UploadedByUserId = 10
        };

        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepo.GetByIdAsync(50, Arg.Any<CancellationToken>()).Returns(vintage);
        _vintageRepo.GetDistinctUserCountAsync(50, Arg.Any<CancellationToken>()).Returns(5);

        var service = CreateService(minUsers: 2);
        var unrelatedActor = new Actor(999, AppRoles.User);

        // Act & Assert: Rejected vintage is hidden from non-uploader
        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.GetByIdAsync(1, 50, actor: unrelatedActor));
    }

    [Fact]
    public async Task GetByIdAsync_ChangingNConfig_ChangesVisibilityResult()
    {
        // Arrange: Pending vintage with 2 users
        var wine = new Wine { Id = 1, WineryId = null };
        var vintage = new WineVintage
        {
            Id = 50,
            WineId = 1,
            Year = 2022,
            ApprovalStatus = ApprovalStatus.Pending,
            UploadedByUserId = 10
        };

        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepo.GetByIdAsync(50, Arg.Any<CancellationToken>()).Returns(vintage);
        _vintageRepo.GetGrapesByVintageIdAsync(50, Arg.Any<CancellationToken>()).Returns([]);
        _vintageRepo.IsUserParticipantAsync(50, 999, Arg.Any<CancellationToken>()).Returns(false);
        _vintageRepo.GetDistinctUserCountAsync(50, Arg.Any<CancellationToken>()).Returns(2);

        // Service with N=3: with 2 users, 2 < 3 -> should hide!
        var serviceWithN3 = CreateService(minUsers: 3);
        var actor = new Actor(999, AppRoles.User);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() =>
            serviceWithN3.GetByIdAsync(1, 50, actor: actor));

        // With N=2: 2 >= 2 -> should be visible!
        var serviceWithN2 = CreateService(minUsers: 2);
        var result = await serviceWithN2.GetByIdAsync(1, 50, actor: actor);
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetAllByWineIdAsync_PendingVintages_RespectsThresholdAndParticipation()
    {
        // Arrange
        var wine = new Wine { Id = 1, WineryId = null, Name = "Vino Comunitario" };
        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);

        var vintages = new List<WineVintage>
        {
            new() { Id = 101, WineId = 1, Year = 2020, ApprovalStatus = ApprovalStatus.Approved, UploadedByUserId = 1 },
            new() { Id = 102, WineId = 1, Year = 2021, ApprovalStatus = ApprovalStatus.Pending, UploadedByUserId = 2 }, // 1 user (hidden to strangers)
            new() { Id = 103, WineId = 1, Year = 2022, ApprovalStatus = ApprovalStatus.Pending, UploadedByUserId = 3 }, // 2 users (visible to all)
            new() { Id = 104, WineId = 1, Year = 2023, ApprovalStatus = ApprovalStatus.Rejected, UploadedByUserId = 4 }
        };

        _vintageRepo.GetAllByWineIdAsync(1, Arg.Any<CancellationToken>()).Returns(vintages);
        _vintageRepo.GetGrapesByVintageIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>()).Returns([]);
        _vintageRepo.GetDistinctUserCountsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<int, int> { [102] = 1, [103] = 2 });

        var service = CreateService(minUsers: 2);

        // Act: Anonymous user
        var anonymousList = (await service.GetAllByWineIdAsync(1, actor: null)).ToList();

        // Assert: 101 (Approved) and 103 (Pending with 2 users >= N) are visible
        Assert.Equal(2, anonymousList.Count);
        Assert.Contains(anonymousList, v => v.Id == 101);
        Assert.Contains(anonymousList, v => v.Id == 103);
    }

    [Fact]
    public async Task CellarItemService_AcceptsPendingVintage_RejectsRejectedVintage()
    {
        // Arrange
        var cellarRepo = Substitute.For<ICellarRepository>();
        var itemRepo = Substitute.For<ICellarItemRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();

        var cellar = new Cellar { Id = 10, UserId = 1 };
        cellarRepo.GetByIdAsync(10, 1, Arg.Any<CancellationToken>()).Returns(cellar);

        var pendingVintage = new WineVintage { Id = 100, WineId = 1, ApprovalStatus = ApprovalStatus.Pending };
        var rejectedVintage = new WineVintage { Id = 200, WineId = 1, ApprovalStatus = ApprovalStatus.Rejected };

        vintageRepo.GetByIdAsync(100, Arg.Any<CancellationToken>()).Returns(pendingVintage);
        vintageRepo.GetByIdAsync(200, Arg.Any<CancellationToken>()).Returns(rejectedVintage);

        itemRepo.GetRowAsync(10, 100, Arg.Any<CancellationToken>())
            .Returns(new CellarItemListRow { WineVintageId = 100, WineId = 1, Name = "Vino", Quantity = 1 });

        var cellarService = new CellarItemService(cellarRepo, itemRepo, vintageRepo);

        // Act 1: Pending vintage is accepted
        var pendingResult = await cellarService.AddAsync(1, 10, new AddCellarItemRequestDto(100, 2));
        Assert.NotNull(pendingResult);

        // Act 2: Rejected vintage throws ValidationException
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            cellarService.AddAsync(1, 10, new AddCellarItemRequestDto(200, 1)));
        Assert.Contains("rechazada", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ReviewService_AcceptsPendingVintage_RejectsRejectedVintage()
    {
        // Arrange
        var reviewRepo = Substitute.For<IReviewRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();

        var pendingVintage = new WineVintage { Id = 100, WineId = 1, ApprovalStatus = ApprovalStatus.Pending };
        var rejectedVintage = new WineVintage { Id = 200, WineId = 1, ApprovalStatus = ApprovalStatus.Rejected };

        vintageRepo.ExistsByIdAsync(100, Arg.Any<CancellationToken>()).Returns(true);
        vintageRepo.ExistsByIdAsync(200, Arg.Any<CancellationToken>()).Returns(true);

        vintageRepo.GetByIdAsync(100, Arg.Any<CancellationToken>()).Returns(pendingVintage);
        vintageRepo.GetByIdAsync(200, Arg.Any<CancellationToken>()).Returns(rejectedVintage);

        reviewRepo.ExistsForUserAndVintageAsync(1, 100, Arg.Any<CancellationToken>()).Returns(false);
        reviewRepo.CreateAsync(Arg.Any<Review>(), Arg.Any<CancellationToken>()).Returns(1);
        reviewRepo.GetResponseByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(new ReviewResponseDto(1, 1, "testuser", 100, null, 4, "Muy rico", DateTime.UtcNow, null));

        var reviewService = new ReviewService(reviewRepo, vintageRepo);

        // Act 1: Pending vintage accepts review
        var result = await reviewService.CreateAsync(new CreateReviewRequestDto(100, 4, "Muy rico"), userId: 1);
        Assert.NotNull(result);

        // Act 2: Rejected vintage throws ValidationException
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            reviewService.CreateAsync(new CreateReviewRequestDto(200, 4, "No permitido"), userId: 1));
        Assert.Contains("rechazada", ex.Message, StringComparison.OrdinalIgnoreCase);
    }
}
