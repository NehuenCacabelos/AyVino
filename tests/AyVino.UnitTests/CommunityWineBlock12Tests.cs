using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AyVino.Api.Features.Follows.DTOs;
using AyVino.Api.Features.Follows.Models;
using AyVino.Api.Features.Follows.Repositories;
using AyVino.Api.Features.Follows.Services;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.WineryCatalog.Repositories;
using NSubstitute;
using Xunit;

namespace AyVino.UnitTests;

public class CommunityWineBlock12Tests
{
    private readonly IFollowRepository _followRepo = Substitute.For<IFollowRepository>();
    private readonly IUserRepository _userRepo = Substitute.For<IUserRepository>();
    private readonly IWineryRepository _wineryRepo = Substitute.For<IWineryRepository>();

    private FollowService CreateService() => new(_followRepo, _userRepo, _wineryRepo);

    // =========================================================================
    // 1. DTO & Mapping Tests
    // =========================================================================

    [Fact]
    public void FollowWineryResponseDto_ContainsAllFields_AndBackwardCompatibleDefaults()
    {
        var followedAt = DateTime.UtcNow;
        var logoId = Guid.NewGuid();

        // Full constructor
        var dto = new FollowWineryResponseDto(
            WineryId: 10,
            Name: "Catena Zapata",
            FollowedAt: followedAt,
            LogoImageId: logoId,
            StateName: "Mendoza",
            RegionName: "Luján de Cuyo",
            LabelsCount: 15,
            FollowersCount: 120);

        Assert.Equal(10, dto.WineryId);
        Assert.Equal("Catena Zapata", dto.Name);
        Assert.Equal(followedAt, dto.FollowedAt);
        Assert.Equal(logoId, dto.LogoImageId);
        Assert.Equal("Mendoza", dto.StateName);
        Assert.Equal("Luján de Cuyo", dto.RegionName);
        Assert.Equal(15, dto.LabelsCount);
        Assert.Equal(120, dto.FollowersCount);

        // Backward compatibility (default parameters)
        var compactDto = new FollowWineryResponseDto(10, "Catena Zapata", followedAt);
        Assert.Equal(10, compactDto.WineryId);
        Assert.Equal("Catena Zapata", compactDto.Name);
        Assert.Equal(followedAt, compactDto.FollowedAt);
        Assert.Null(compactDto.LogoImageId);
        Assert.Null(compactDto.StateName);
        Assert.Null(compactDto.RegionName);
        Assert.Equal(0, compactDto.LabelsCount);
        Assert.Equal(0, compactDto.FollowersCount);
    }

    [Fact]
    public void FollowMappingExtensions_ToResponseDto_MapsAllFieldsCorrectly()
    {
        var logoId = Guid.NewGuid();
        var followedAt = DateTime.UtcNow;

        var item = new FollowWineryItem
        {
            WineryId = 42,
            Name = "Bodega Zuccardi",
            FollowedAt = followedAt,
            LogoImageId = logoId,
            StateName = "Mendoza",
            RegionName = "Valle de Uco",
            LabelsCount = 28,
            FollowersCount = 350
        };

        var dto = item.ToResponseDto();

        Assert.Equal(42, dto.WineryId);
        Assert.Equal("Bodega Zuccardi", dto.Name);
        Assert.Equal(followedAt, dto.FollowedAt);
        Assert.Equal(logoId, dto.LogoImageId);
        Assert.Equal("Mendoza", dto.StateName);
        Assert.Equal("Valle de Uco", dto.RegionName);
        Assert.Equal(28, dto.LabelsCount);
        Assert.Equal(350, dto.FollowersCount);
    }

    [Fact]
    public void FollowMappingExtensions_ToResponseDto_HandlesNullsAndWhitespaceGracefully()
    {
        var followedAt = DateTime.UtcNow;

        var item = new FollowWineryItem
        {
            WineryId = 5,
            Name = "Bodega Artesanal",
            FollowedAt = followedAt,
            LogoImageId = null,
            StateName = "   ",
            RegionName = null,
            LabelsCount = 0,
            FollowersCount = 1
        };

        var dto = item.ToResponseDto();

        Assert.Equal(5, dto.WineryId);
        Assert.Equal("Bodega Artesanal", dto.Name);
        Assert.Null(dto.LogoImageId);
        Assert.Null(dto.StateName);
        Assert.Null(dto.RegionName);
        Assert.Equal(0, dto.LabelsCount);
        Assert.Equal(1, dto.FollowersCount);
    }

    // =========================================================================
    // 2. Service & Pagination Tests
    // =========================================================================

    [Fact]
    public async Task GetMyFollowingWineriesAsync_ReturnsMappedList_PreservingPaginationAndOrder()
    {
        var now = DateTime.UtcNow;
        var logoId1 = Guid.NewGuid();

        var repoItems = new List<FollowWineryItem>
        {
            new()
            {
                WineryId = 1,
                Name = "Bodega Uno",
                FollowedAt = now,
                LogoImageId = logoId1,
                StateName = "Mendoza",
                RegionName = "Maipú",
                LabelsCount = 10,
                FollowersCount = 50
            },
            new()
            {
                WineryId = 2,
                Name = "Bodega Dos",
                FollowedAt = now.AddDays(-1),
                LogoImageId = null,
                StateName = "Salta",
                RegionName = "Cafayate",
                LabelsCount = 4,
                FollowersCount = 12
            }
        };

        _followRepo.GetFollowingWineriesAsync(123, 1, 10, Arg.Any<CancellationToken>())
            .Returns(repoItems);

        var service = CreateService();
        var result = await service.GetMyFollowingWineriesAsync(123, 1, 10);

        Assert.Equal(2, result.Count);
        Assert.Equal("Bodega Uno", result[0].Name);
        Assert.Equal(logoId1, result[0].LogoImageId);
        Assert.Equal(10, result[0].LabelsCount);
        Assert.Equal(50, result[0].FollowersCount);

        Assert.Equal("Bodega Dos", result[1].Name);
        Assert.Null(result[1].LogoImageId);
        Assert.Equal("Salta", result[1].StateName);
        Assert.Equal("Cafayate", result[1].RegionName);
        Assert.Equal(4, result[1].LabelsCount);
        Assert.Equal(12, result[1].FollowersCount);

        await _followRepo.Received(1).GetFollowingWineriesAsync(123, 1, 10, Arg.Any<CancellationToken>());
    }

    // =========================================================================
    // 3. Reusable SQL Fragments & Logic Consistency Tests
    // =========================================================================

    [Fact]
    public void WineryCatalogSqlFragments_LocationJoins_FormatsCorrectTableAlias()
    {
        var sql = string.Format(WineryCatalogSqlFragments.LocationJoins, "w");

        Assert.Contains("LEFT JOIN locations l ON l.id = w.location_id", sql);
        Assert.Contains("LEFT JOIN cities c ON c.id = l.city_id", sql);
        Assert.Contains("LEFT JOIN states s ON s.id = c.state_id", sql);
    }

    [Fact]
    public void WineryCatalogSqlFragments_ApprovedWineryLabelsCountSubquery_MatchesPublicCatalogRules()
    {
        var sql = string.Format(WineryCatalogSqlFragments.ApprovedWineryLabelsCountSubquery, "w");

        Assert.Contains("SELECT COUNT(DISTINCT w_in.id)", sql);
        Assert.Contains("WHERE w_in.winery_id = w.id", sql);
        Assert.Contains("AND w_in.duplicate_of_wine_id IS NULL", sql);
        Assert.Contains("AND v_in.approval_status = 2", sql);
    }

    [Fact]
    public void WineryCatalogSqlFragments_FollowersCountSubquery_ExcludesOwnerFromFollowers()
    {
        var sql = string.Format(WineryCatalogSqlFragments.FollowersCountSubquery, "w");

        Assert.Contains("SELECT COUNT(*)", sql);
        Assert.Contains("FROM winery_follows wf_in", sql);
        Assert.Contains("WHERE wf_in.winery_id = w.id", sql);
        Assert.Contains("AND (w.user_id IS NULL OR wf_in.follower_id != w.user_id)", sql);
    }

    // =========================================================================
    // 4. In-Memory Business Logic Simulation for Labels & Followers
    // =========================================================================

    public record FakeWine(int Id, int WineryId, int? DuplicateOfWineId);
    public record FakeVintage(int Id, int WineId, int ApprovalStatus);
    public record FakeFollow(int WineryId, int FollowerId);

    [Fact]
    public void LabelsAndFollowersLogic_MatchesExpectedSpecification()
    {
        int wineryId = 10;
        int? wineryOwnerUserId = 99;

        var wines = new List<FakeWine>
        {
            new(1, wineryId, null),
            new(2, wineryId, null),
            new(3, wineryId, 1), // Duplicate: must NOT count
            new(4, 999, null)    // Different winery: must NOT count
        };

        var vintages = new List<FakeVintage>
        {
            new(101, 1, 2), // Approved -> Wine 1 counts
            new(102, 1, 2), // Approved -> Wine 1 already counted (DISTINCT)
            new(103, 2, 1), // Pending -> Wine 2 has no approved vintage yet, must NOT count
            new(104, 3, 2)  // Wine 3 is a duplicate, must NOT count
        };

        var follows = new List<FakeFollow>
        {
            new(wineryId, 50),
            new(wineryId, 51),
            new(wineryId, 99),  // Owner following own winery -> must NOT count
            new(888, 52)        // Different winery
        };

        // Labels count logic
        var labelsCount = wines
            .Where(w => w.WineryId == wineryId && w.DuplicateOfWineId == null)
            .Where(w => vintages.Any(v => v.WineId == w.Id && v.ApprovalStatus == 2))
            .Select(w => w.Id)
            .Distinct()
            .Count();

        Assert.Equal(1, labelsCount);

        // Followers count logic
        var followersCount = follows
            .Where(f => f.WineryId == wineryId && (!wineryOwnerUserId.HasValue || f.FollowerId != wineryOwnerUserId.Value))
            .Count();

        Assert.Equal(2, followersCount);
    }
}
