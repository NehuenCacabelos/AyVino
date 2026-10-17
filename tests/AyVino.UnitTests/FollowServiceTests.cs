using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Follows.Models;
using AyVino.Api.Features.Follows.Repositories;
using AyVino.Api.Features.Follows.Services;
using AyVino.Api.Features.Users.Models;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using NSubstitute;

namespace AyVino.UnitTests;

public class FollowServiceTests
{
    private readonly IFollowRepository _followRepository = Substitute.For<IFollowRepository>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IWineryRepository _wineryRepository = Substitute.For<IWineryRepository>();
    private readonly FollowService _followService;

    public FollowServiceTests()
    {
        _followService = new FollowService(_followRepository, _userRepository, _wineryRepository);
    }

    [Fact]
    public async Task FollowUserAsync_SameUser_ThrowsValidationException()
    {
        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _followService.FollowUserAsync(1, 1));
        Assert.Contains("sí mismo", ex.Message, StringComparison.OrdinalIgnoreCase);
        await _followRepository.DidNotReceive().AddUserFollowAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task FollowUserAsync_TargetUserDoesNotExist_ThrowsNotFoundException()
    {
        // Arrange
        _userRepository.GetByIdAsync(2, Arg.Any<CancellationToken>())
            .Returns((User?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _followService.FollowUserAsync(1, 2));
        await _followRepository.DidNotReceive().AddUserFollowAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task FollowUserAsync_TargetUserInactive_ThrowsNotFoundException()
    {
        // Arrange
        var inactiveUser = new User
        {
            Id = 2,
            Username = "inactivo",
            Email = "inactivo@example.com",
            IsActive = false
        };
        _userRepository.GetByIdAsync(2, Arg.Any<CancellationToken>())
            .Returns(inactiveUser);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _followService.FollowUserAsync(1, 2));
        await _followRepository.DidNotReceive().AddUserFollowAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task FollowUserAsync_AlreadyFollowing_ThrowsConflictException()
    {
        // Arrange
        var activeUser = new User
        {
            Id = 2,
            Username = "activo",
            Email = "activo@example.com",
            IsActive = true
        };
        _userRepository.GetByIdAsync(2, Arg.Any<CancellationToken>())
            .Returns(activeUser);

        _followRepository.AddUserFollowAsync(1, 2, Arg.Any<CancellationToken>())
            .Returns(false);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() => _followService.FollowUserAsync(1, 2));
        Assert.Contains("Ya seguís al usuario", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task FollowUserAsync_ValidRequest_AddsFollowSuccessfully()
    {
        // Arrange
        var activeUser = new User
        {
            Id = 2,
            Username = "activo",
            Email = "activo@example.com",
            IsActive = true
        };
        _userRepository.GetByIdAsync(2, Arg.Any<CancellationToken>())
            .Returns(activeUser);

        _followRepository.AddUserFollowAsync(1, 2, Arg.Any<CancellationToken>())
            .Returns(true);

        // Act
        await _followService.FollowUserAsync(1, 2);

        // Assert
        await _followRepository.Received(1).AddUserFollowAsync(1, 2, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UnfollowUserAsync_NotFollowing_ThrowsNotFoundException()
    {
        // Arrange
        _followRepository.RemoveUserFollowAsync(1, 2, Arg.Any<CancellationToken>())
            .Returns(false);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() => _followService.UnfollowUserAsync(1, 2));
        Assert.Contains("No seguís al usuario", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UnfollowUserAsync_Following_RemovesFollowSuccessfully()
    {
        // Arrange
        _followRepository.RemoveUserFollowAsync(1, 2, Arg.Any<CancellationToken>())
            .Returns(true);

        // Act
        await _followService.UnfollowUserAsync(1, 2);

        // Assert
        await _followRepository.Received(1).RemoveUserFollowAsync(1, 2, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task FollowWineryAsync_WineryDoesNotExist_ThrowsNotFoundException()
    {
        // Arrange
        _wineryRepository.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns((Winery?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _followService.FollowWineryAsync(1, 10));
        await _followRepository.DidNotReceive().AddWineryFollowAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task FollowWineryAsync_WineryPending_ThrowsNotFoundException()
    {
        // Arrange
        var pendingWinery = new Winery
        {
            Id = 10,
            Name = "Bodega Pendiente",
            Status = WineryStatus.Pending
        };
        _wineryRepository.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(pendingWinery);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() => _followService.FollowWineryAsync(1, 10));
        Assert.Contains("Bodega con ID 10 no encontrada", ex.Message, StringComparison.OrdinalIgnoreCase);
        await _followRepository.DidNotReceive().AddWineryFollowAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task FollowWineryAsync_AlreadyFollowing_ThrowsConflictException()
    {
        // Arrange
        var approvedWinery = new Winery
        {
            Id = 10,
            Name = "Bodega Bianchi",
            Status = WineryStatus.Approved
        };
        _wineryRepository.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(approvedWinery);

        _followRepository.AddWineryFollowAsync(1, 10, Arg.Any<CancellationToken>())
            .Returns(false);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() => _followService.FollowWineryAsync(1, 10));
        Assert.Contains("Ya seguís a la bodega", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task FollowWineryAsync_ApprovedWinery_AddsFollowSuccessfully()
    {
        // Arrange
        var approvedWinery = new Winery
        {
            Id = 10,
            Name = "Bodega Bianchi",
            Status = WineryStatus.Approved
        };
        _wineryRepository.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(approvedWinery);

        _followRepository.AddWineryFollowAsync(1, 10, Arg.Any<CancellationToken>())
            .Returns(true);

        // Act
        await _followService.FollowWineryAsync(1, 10);

        // Assert
        await _followRepository.Received(1).AddWineryFollowAsync(1, 10, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UnfollowWineryAsync_NotFollowing_ThrowsNotFoundException()
    {
        // Arrange
        _followRepository.RemoveWineryFollowAsync(1, 10, Arg.Any<CancellationToken>())
            .Returns(false);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() => _followService.UnfollowWineryAsync(1, 10));
        Assert.Contains("No seguís a la bodega", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UnfollowWineryAsync_Following_RemovesFollowSuccessfully()
    {
        // Arrange
        _followRepository.RemoveWineryFollowAsync(1, 10, Arg.Any<CancellationToken>())
            .Returns(true);

        // Act
        await _followService.UnfollowWineryAsync(1, 10);

        // Assert
        await _followRepository.Received(1).RemoveWineryFollowAsync(1, 10, Arg.Any<CancellationToken>());
    }
}
