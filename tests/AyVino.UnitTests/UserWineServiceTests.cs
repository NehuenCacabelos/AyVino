using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.UserWines.Models;
using AyVino.Api.Features.UserWines.Repositories;
using AyVino.Api.Features.UserWines.Services;
using AyVino.Api.Features.Wines.Repositories;
using NSubstitute;

namespace AyVino.UnitTests;

public class UserWineServiceTests
{
    private readonly IUserWineRepository _userWineRepository = Substitute.For<IUserWineRepository>();
    private readonly IWineRepository _wineRepository = Substitute.For<IWineRepository>();
    private readonly UserWineService _userWineService;

    public UserWineServiceTests()
    {
        _userWineService = new UserWineService(_userWineRepository, _wineRepository);
    }

    [Fact]
    public async Task MarkWantedAsync_WineExists_CallsMarkWithWantedTrue()
    {
        // Arrange
        _wineRepository.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);

        // Act
        await _userWineService.MarkWantedAsync(1, 10);

        // Assert
        await _userWineRepository.Received(1).MarkAsync(1, 10, wanted: true, tried: false, favorite: false, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task MarkWantedAsync_WineDoesNotExist_ThrowsNotFoundException()
    {
        // Arrange
        _wineRepository.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(false);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _userWineService.MarkWantedAsync(1, 10));
        await _userWineRepository.DidNotReceive().MarkAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UnmarkWantedAsync_WineExists_CallsUnmarkWithClearWantedTrue()
    {
        // Arrange
        _wineRepository.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);

        // Act
        await _userWineService.UnmarkWantedAsync(1, 10);

        // Assert
        await _userWineRepository.Received(1).UnmarkAsync(1, 10, clearWanted: true, clearFavorite: false, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UnmarkWantedAsync_WineDoesNotExist_ThrowsNotFoundException()
    {
        // Arrange
        _wineRepository.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(false);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _userWineService.UnmarkWantedAsync(1, 10));
        await _userWineRepository.DidNotReceive().UnmarkAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task MarkTriedAsync_WineExists_CallsMarkWithTriedTrue()
    {
        // Arrange
        _wineRepository.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);

        // Act
        await _userWineService.MarkTriedAsync(1, 10);

        // Assert
        await _userWineRepository.Received(1).MarkAsync(1, 10, wanted: false, tried: true, favorite: false, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task MarkTriedAsync_WineDoesNotExist_ThrowsNotFoundException()
    {
        // Arrange
        _wineRepository.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(false);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _userWineService.MarkTriedAsync(1, 10));
        await _userWineRepository.DidNotReceive().MarkAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task MarkFavoriteAsync_WineExists_CallsMarkWithFavoriteTrue()
    {
        // Arrange
        _wineRepository.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);

        // Act
        await _userWineService.MarkFavoriteAsync(1, 10);

        // Assert
        await _userWineRepository.Received(1).MarkAsync(1, 10, wanted: false, tried: false, favorite: true, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task MarkFavoriteAsync_WineDoesNotExist_ThrowsNotFoundException()
    {
        // Arrange
        _wineRepository.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(false);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _userWineService.MarkFavoriteAsync(1, 10));
        await _userWineRepository.DidNotReceive().MarkAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UnmarkFavoriteAsync_WineExists_CallsUnmarkWithClearFavoriteTrue()
    {
        // Arrange
        _wineRepository.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);

        // Act
        await _userWineService.UnmarkFavoriteAsync(1, 10);

        // Assert
        await _userWineRepository.Received(1).UnmarkAsync(1, 10, clearWanted: false, clearFavorite: true, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UnmarkFavoriteAsync_WineDoesNotExist_ThrowsNotFoundException()
    {
        // Arrange
        _wineRepository.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(false);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _userWineService.UnmarkFavoriteAsync(1, 10));
        await _userWineRepository.DidNotReceive().UnmarkAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetMarksAsync_NoRow_ReturnsAllMarksFalse()
    {
        // Arrange
        _wineRepository.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);
        _userWineRepository.GetAsync(1, 10, Arg.Any<CancellationToken>()).Returns((UserWine?)null);

        // Act
        var result = await _userWineService.GetMarksAsync(1, 10);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.WineId);
        Assert.False(result.IsWanted);
        Assert.False(result.IsTried);
        Assert.False(result.IsFavorite);
    }

    [Fact]
    public async Task GetMarksAsync_HasRow_ReturnsMappedMarks()
    {
        // Arrange
        var row = new UserWine
        {
            UserId = 1,
            WineId = 10,
            IsWanted = true,
            IsTried = true,
            IsFavorite = false
        };
        _wineRepository.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);
        _userWineRepository.GetAsync(1, 10, Arg.Any<CancellationToken>()).Returns(row);

        // Act
        var result = await _userWineService.GetMarksAsync(1, 10);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.WineId);
        Assert.True(result.IsWanted);
        Assert.True(result.IsTried);
        Assert.False(result.IsFavorite);
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(-1, 10)]
    [InlineData(1, 0)]
    [InlineData(1, 101)]
    public async Task GetAllByUserAsync_InvalidPagination_ThrowsValidationException(int pageNumber, int pageSize)
    {
        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() =>
            _userWineService.GetAllByUserAsync(1, pageNumber, pageSize, null, null, null));
    }
}
