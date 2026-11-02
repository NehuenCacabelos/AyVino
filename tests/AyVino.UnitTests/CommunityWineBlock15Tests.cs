using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.Configuration;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using Microsoft.Extensions.Options;
using NSubstitute;
using Xunit;

namespace AyVino.UnitTests;

public class CommunityWineBlock15Tests
{
    private readonly IWineVintageRepository _vintageRepo = Substitute.For<IWineVintageRepository>();
    private readonly IWineRepository _wineRepo = Substitute.For<IWineRepository>();
    private readonly IGrapeRepository _grapeRepo = Substitute.For<IGrapeRepository>();
    private readonly IWineryRepository _wineryRepo = Substitute.For<IWineryRepository>();
    private readonly IOptions<CommunityOptions> _communityOptions = Options.Create(new CommunityOptions { MinUsersForPublicVisibility = 2 });

    private WineVintageService CreateService() =>
        new(_vintageRepo, _wineRepo, _grapeRepo, _wineryRepo, _communityOptions);

    // =========================================================================
    // 1. SQL Fragment Unification & CommunityVintageSql tests
    // =========================================================================
    [Fact]
    public void CommunityVintageSql_UsersOfSingleVintageUnion_IncludesUserActivitiesAndAllSources()
    {
        var sql = CommunityVintageSql.UsersOfSingleVintageUnion("@VintageId");

        Assert.Contains("uploaded_by_user_id AS user_id", sql);
        Assert.Contains("cellar_items", sql);
        Assert.Contains("reviews", sql);
        Assert.Contains("user_vintage_images", sql);
        Assert.Contains("user_activities", sql);
        Assert.Contains("wine_vintage_id = @VintageId", sql);
    }

    [Fact]
    public void CommunityVintageSql_UsersOfMultipleVintagesUnion_IncludesUserActivitiesAndBatchIds()
    {
        var sql = CommunityVintageSql.UsersOfMultipleVintagesUnion("@VintageIds");

        Assert.Contains("uploaded_by_user_id AS user_id", sql);
        Assert.Contains("cellar_items", sql);
        Assert.Contains("reviews", sql);
        Assert.Contains("user_vintage_images", sql);
        Assert.Contains("user_activities", sql);
        Assert.Contains("ANY(@VintageIds)", sql);
    }

    [Fact]
    public void CommunityVintageSql_IsUserParticipantExists_IncludesUserActivities()
    {
        var sql = CommunityVintageSql.IsUserParticipantExists("@VintageId", "@UserId");

        Assert.Contains("SELECT EXISTS", sql);
        Assert.Contains("user_activities WHERE wine_vintage_id = @VintageId AND user_id = @UserId", sql);
    }

    [Fact]
    public void CommunityVintageSql_CommunityUsersCountSubquery_CountsDistinctUsersAcrossAllSources()
    {
        var sql = CommunityVintageSql.CommunityUsersCountSubquery("wv");

        Assert.Contains("COUNT(DISTINCT usr.user_id)", sql);
        Assert.Contains("user_activities ua WHERE ua.wine_vintage_id = wv.id", sql);
    }

    [Fact]
    public void WineRepository_BuildVintageVisibilityCondition_UsesCommunityUsersSubqueryAndBlocksRejectedForActivities()
    {
        var sql = WineRepository.BuildVintageVisibilityCondition("wv", "wy");

        Assert.Contains("user_activities ua WHERE ua.wine_vintage_id = wv.id AND ua.user_id = @CurrentUserId", sql);
        Assert.Contains("wv.approval_status != 3", sql);
        Assert.Contains("COUNT(DISTINCT usr.user_id)", sql);
        Assert.Contains(">= @MinUsers", sql);
    }

    // =========================================================================
    // 2. Service Visibility: User with only activity on Pending vintage sees it
    // =========================================================================
    [Fact]
    public async Task GetByIdAsync_UserWithOnlyActivityOnAnotherUserPendingVintage_SeesItWith200()
    {
        var service = CreateService();
        var wineId = 10;
        var vintageId = 50;
        var uploaderId = 1;
        var activityUserId = 2;

        var wine = new Wine { Id = wineId, Name = "Vino Comunitario", WineType = WineType.Red };
        var vintage = new WineVintage
        {
            Id = vintageId,
            WineId = wineId,
            Year = 2021,
            ApprovalStatus = ApprovalStatus.Pending,
            UploadedByUserId = uploaderId
        };

        _wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepo.GetByIdAsync(vintageId, Arg.Any<CancellationToken>()).Returns(vintage);
        _vintageRepo.IsUserParticipantAsync(vintageId, activityUserId, Arg.Any<CancellationToken>()).Returns(true);
        _vintageRepo.GetGrapesByVintageIdAsync(vintageId, Arg.Any<CancellationToken>()).Returns(new List<WineGrape>());

        var actor = new Actor(activityUserId, AppRoles.User);
        var result = await service.GetByIdAsync(wineId, vintageId, actor);

        Assert.NotNull(result);
        Assert.Equal(vintageId, result.Id);
        Assert.Equal("Pending", result.ApprovalStatus);
    }

    // =========================================================================
    // 3. Service Visibility: 2 distinct users with only activities reach threshold
    // =========================================================================
    [Fact]
    public async Task GetByIdAsync_TwoUsersWithOnlyActivities_MakePendingVintagePubliclyVisible()
    {
        var service = CreateService();
        var wineId = 10;
        var vintageId = 50;
        var anonymousOrNonParticipant = new Actor(99, AppRoles.User);

        var wine = new Wine { Id = wineId, Name = "Vino Comunitario", WineType = WineType.Red };
        var vintage = new WineVintage
        {
            Id = vintageId,
            WineId = wineId,
            Year = 2021,
            ApprovalStatus = ApprovalStatus.Pending,
            UploadedByUserId = 1
        };

        _wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepo.GetByIdAsync(vintageId, Arg.Any<CancellationToken>()).Returns(vintage);
        // Non-participant
        _vintageRepo.IsUserParticipantAsync(vintageId, 99, Arg.Any<CancellationToken>()).Returns(false);
        // Distinct user count reaches threshold of 2 users
        _vintageRepo.GetDistinctUserCountAsync(vintageId, Arg.Any<CancellationToken>()).Returns(2);
        _vintageRepo.GetGrapesByVintageIdAsync(vintageId, Arg.Any<CancellationToken>()).Returns(new List<WineGrape>());

        var result = await service.GetByIdAsync(wineId, vintageId, anonymousOrNonParticipant);

        Assert.NotNull(result);
        Assert.Equal(vintageId, result.Id);
    }

    // =========================================================================
    // 4. Service Visibility: Rejected vintage remains hidden for participant
    // =========================================================================
    [Fact]
    public async Task GetByIdAsync_RejectedVintage_RemainsHiddenForUserWithActivity()
    {
        var service = CreateService();
        var wineId = 10;
        var vintageId = 50;
        var activityUserId = 2;

        var wine = new Wine { Id = wineId, Name = "Vino Rechazado", WineType = WineType.Red };
        var vintage = new WineVintage
        {
            Id = vintageId,
            WineId = wineId,
            Year = 2021,
            ApprovalStatus = ApprovalStatus.Rejected,
            UploadedByUserId = 1
        };

        _wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepo.GetByIdAsync(vintageId, Arg.Any<CancellationToken>()).Returns(vintage);

        var actor = new Actor(activityUserId, AppRoles.User);
        await Assert.ThrowsAsync<NotFoundException>(() => service.GetByIdAsync(wineId, vintageId, actor));
    }

    // =========================================================================
    // 5. GetAllByWineIdAsync: User with activity sees pending vintage in list
    // =========================================================================
    [Fact]
    public async Task GetAllByWineIdAsync_UserWithActivity_SeesPendingVintageInList()
    {
        var service = CreateService();
        var wineId = 10;
        var activityUserId = 2;

        var wine = new Wine { Id = wineId, Name = "Vino Comunitario", WineType = WineType.Red };
        var pendingVintage = new WineVintage
        {
            Id = 50,
            WineId = wineId,
            Year = 2021,
            ApprovalStatus = ApprovalStatus.Pending,
            UploadedByUserId = 1
        };

        _wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepo.GetAllByWineIdAsync(wineId, Arg.Any<CancellationToken>()).Returns([pendingVintage]);
        _vintageRepo.GetDistinctUserCountsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<int, int> { [50] = 1 });
        _vintageRepo.GetParticipantVintageIdsAsync(activityUserId, Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>())
            .Returns([50]);
        _vintageRepo.GetGrapesByVintageIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>())
            .Returns(new List<WineGrape>());

        var actor = new Actor(activityUserId, AppRoles.User);
        var results = (await service.GetAllByWineIdAsync(wineId, actor)).ToList();

        Assert.Single(results);
        Assert.Equal(50, results[0].Id);
    }
}
