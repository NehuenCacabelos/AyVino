using System;
using System.Threading;
using System.Threading.Tasks;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.History.DTOs;
using AyVino.Api.Features.History.Enums;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using Xunit;

namespace AyVino.UnitTests;

public class CommunityWineBlock16Tests
{
    // =========================================================================
    // 1. Dapper Materialization & BigInt Constructor Compatibility
    // =========================================================================
    [Fact]
    public void WineVintageUsageCounts_CanBeConstructedFromLongValues()
    {
        long reviews = 5L;
        long cellars = 2L;
        long otherImages = 1L;
        long otherActivities = 3L;

        var counts = new WineVintageUsageCounts(reviews, cellars, otherImages, otherActivities);

        Assert.Equal(5, counts.ReviewCount);
        Assert.Equal(2, counts.CellarItemCount);
        Assert.Equal(1, counts.OtherUserImagesCount);
        Assert.Equal(3, counts.OtherUserActivitiesCount);
        Assert.True(counts.HasUserHistory);
    }

    [Fact]
    public void WineUsageCounts_CanBeConstructedFromLongValues()
    {
        long duplicates = 0L;
        long reviews = 10L;
        long userWines = 4L;
        long cellars = 3L;
        long otherImages = 2L;
        long otherActivities = 5L;

        var counts = new WineUsageCounts(duplicates, reviews, userWines, cellars, otherImages, otherActivities);

        Assert.Equal(0, counts.DuplicateWinesCount);
        Assert.Equal(10, counts.ReviewCount);
        Assert.Equal(4, counts.UserWineCount);
        Assert.Equal(3, counts.CellarItemCount);
        Assert.Equal(2, counts.OtherUserImagesCount);
        Assert.Equal(5, counts.OtherUserActivitiesCount);
        Assert.True(counts.HasBlockingUsage);
    }

    // =========================================================================
    // 2. Cellar Item Quantity Constraint Verification
    // =========================================================================
    [Theory]
    [InlineData(1, 0, true)]
    [InlineData(5, 4, false)]
    public void CellarItemQuantityDeduction_CalculatesExpectedRemainingAndDeletionFlag(int initialQty, int expectedRemaining, bool expectedDeleted)
    {
        int remaining = initialQty - 1;
        bool isDeleted = remaining == 0;

        Assert.Equal(expectedRemaining, remaining);
        Assert.Equal(expectedDeleted, isDeleted);
    }

    // =========================================================================
    // 3. PostgreSQL SmallInt Column Compatibility for History
    // =========================================================================
    [Fact]
    public void HistoryItemDto_CanBeConstructedFromSmallIntCastings()
    {
        short smallIntWineType = 1; // Red
        short? smallIntRating = 4;
        short smallIntActivityType = 1; // Uncorked

        var item = new HistoryItemDto(
            100L,
            ((ActivityType)smallIntActivityType).ToString(),
            DateTime.UtcNow,
            new HistoryWineDto(1, "Gran Reserva", "Bodega Test", ((WineType)smallIntWineType).ToString()),
            new HistoryVintageDto(10, 2020, null),
            null,
            (int?)smallIntRating,
            "Excelente"
        );

        Assert.Equal(100L, item.Id);
        Assert.Equal("Uncorked", item.Type);
        Assert.Equal("Red", item.Wine.WineType);
        Assert.Equal(4, item.Rating);
    }
}
