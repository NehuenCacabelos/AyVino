using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Rules;

namespace AyVino.UnitTests.Authorization;

public class WineryAccessRulesTests
{
    private static Winery CreateWinery(int? userId, WineryStatus status = WineryStatus.Approved) =>
        new()
        {
            Id = 1,
            Name = "Bodega Test",
            LocationId = 1,
            UserId = userId,
            Status = status,
            RegisterDate = DateTime.UtcNow
        };

    [Fact]
    public void IsOwner_OwnerUser_ReturnsTrue()
    {
        // Arrange
        var winery = CreateWinery(userId: 10);
        var actor = new Actor(10, AppRoles.User);

        // Act
        var result = WineryAccessRules.IsOwner(winery, actor);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsOwner_DifferentUser_ReturnsFalse()
    {
        // Arrange
        var winery = CreateWinery(userId: 10);
        var actor = new Actor(20, AppRoles.User);

        // Act
        var result = WineryAccessRules.IsOwner(winery, actor);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsOwner_WineryWithoutOwner_ReturnsFalse()
    {
        // Arrange
        var winery = CreateWinery(userId: null);
        var actor = new Actor(10, AppRoles.User);

        // Act
        var result = WineryAccessRules.IsOwner(winery, actor);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsOwner_NullWinery_ReturnsFalse()
    {
        // Arrange
        var actor = new Actor(10, AppRoles.User);

        // Act
        var result = WineryAccessRules.IsOwner(null, actor);

        // Assert
        Assert.False(result);
    }

    [Theory]
    [InlineData(null)]
    [InlineData(10)]
    [InlineData(20)]
    public void CanManage_AdminActor_ReturnsTrue(int? wineryUserId)
    {
        // Arrange
        var winery = wineryUserId.HasValue ? CreateWinery(wineryUserId) : null;
        var actor = new Actor(99, AppRoles.Admin);

        // Act
        var result = WineryAccessRules.CanManage(winery, actor);

        // Assert
        Assert.True(result);
    }

    [Theory]
    [InlineData(WineryStatus.Pending)]
    [InlineData(WineryStatus.Approved)]
    [InlineData(WineryStatus.Rejected)]
    public void CanManage_OwnerActor_ReturnsTrue_RegardlessOfStatus(WineryStatus status)
    {
        // Arrange
        var winery = CreateWinery(userId: 10, status: status);
        var actor = new Actor(10, AppRoles.User);

        // Act
        var result = WineryAccessRules.CanManage(winery, actor);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void CanManage_NonOwnerActor_ReturnsFalse()
    {
        // Arrange
        var winery = CreateWinery(userId: 10);
        var actor = new Actor(20, AppRoles.User);

        // Act
        var result = WineryAccessRules.CanManage(winery, actor);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void CanManage_WineryWithoutOwner_NonAdmin_ReturnsFalse()
    {
        // Arrange
        var winery = CreateWinery(userId: null);
        var actor = new Actor(10, AppRoles.User);

        // Act
        var result = WineryAccessRules.CanManage(winery, actor);

        // Assert
        Assert.False(result);
    }

    [Theory]
    [InlineData(WineryStatus.Pending)]
    [InlineData(WineryStatus.Approved)]
    [InlineData(WineryStatus.Rejected)]
    public void CanPublish_AdminActor_ReturnsTrue_RegardlessOfStatus(WineryStatus status)
    {
        // Arrange
        var winery = CreateWinery(userId: 10, status: status);
        var actor = new Actor(99, AppRoles.Admin);

        // Act
        var result = WineryAccessRules.CanPublish(winery, actor);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void CanPublish_AdminActor_NullWinery_ReturnsTrue()
    {
        // Arrange
        var actor = new Actor(99, AppRoles.Admin);

        // Act
        var result = WineryAccessRules.CanPublish(null, actor);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void CanPublish_OwnerActor_ApprovedWinery_ReturnsTrue()
    {
        // Arrange
        var winery = CreateWinery(userId: 10, status: WineryStatus.Approved);
        var actor = new Actor(10, AppRoles.User);

        // Act
        var result = WineryAccessRules.CanPublish(winery, actor);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void CanPublish_OwnerActor_PendingWinery_ReturnsFalse()
    {
        // Arrange
        var winery = CreateWinery(userId: 10, status: WineryStatus.Pending);
        var actor = new Actor(10, AppRoles.User);

        // Act
        var result = WineryAccessRules.CanPublish(winery, actor);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void CanPublish_OwnerActor_RejectedWinery_ReturnsFalse()
    {
        // Arrange
        var winery = CreateWinery(userId: 10, status: WineryStatus.Rejected);
        var actor = new Actor(10, AppRoles.User);

        // Act
        var result = WineryAccessRules.CanPublish(winery, actor);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void CanPublish_NonOwnerActor_ApprovedWinery_ReturnsFalse()
    {
        // Arrange
        var winery = CreateWinery(userId: 10, status: WineryStatus.Approved);
        var actor = new Actor(20, AppRoles.User);

        // Act
        var result = WineryAccessRules.CanPublish(winery, actor);

        // Assert
        Assert.False(result);
    }
}
