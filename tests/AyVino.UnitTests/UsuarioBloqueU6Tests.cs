using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Cellars.Services;
using AyVino.Api.Features.UserWines.DTOs;
using AyVino.Api.Features.UserWines.Models;
using AyVino.Api.Features.Wines.Enums;
using NSubstitute;
using Xunit;

namespace AyVino.UnitTests;

public class UsuarioBloqueU6Tests
{
    private readonly ICellarRepository _cellarRepository = Substitute.For<ICellarRepository>();
    private readonly ICellarItemRepository _itemRepository = Substitute.For<ICellarItemRepository>();
    private readonly CellarItemService _service;

    public UsuarioBloqueU6Tests()
    {
        _service = new CellarItemService(_cellarRepository, _itemRepository, Substitute.For<AyVino.Api.Features.Wines.Repositories.IWineVintageRepository>());
    }

    [Fact]
    public async Task UncorkAsync_WhenSuccessfulAndQuantityRemaining_ReturnsUpdatedItemDto()
    {
        // Arrange
        const int userId = 1;
        const int cellarId = 10;
        const int vintageId = 100;

        _cellarRepository.GetByIdAsync(cellarId, userId, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = cellarId, UserId = userId, Name = "Mi Cava" });

        var updatedRow = new CellarItemListRow
        {
            WineVintageId = vintageId,
            WineId = 42,
            Name = "Gran Malbec",
            WineType = WineType.Red,
            WineryName = "Bodega Norton",
            Year = 2021,
            Quantity = 2,
            LastChangeAt = DateTime.UtcNow
        };

        _itemRepository.UncorkAsync(userId, cellarId, vintageId, Arg.Any<CancellationToken>())
            .Returns(updatedRow);

        // Act
        var result = await _service.UncorkAsync(userId, cellarId, vintageId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(vintageId, result.WineVintageId);
        Assert.Equal(2, result.Quantity);
        Assert.Equal("Bodega Norton", result.WineryName);
        await _itemRepository.Received(1).UncorkAsync(userId, cellarId, vintageId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UncorkAsync_WhenLastBottleUncorked_ReturnsItemWithQuantityZero()
    {
        // Arrange
        const int userId = 1;
        const int cellarId = 10;
        const int vintageId = 101;

        _cellarRepository.GetByIdAsync(cellarId, userId, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = cellarId, UserId = userId, Name = "Mi Cava" });

        var zeroRow = new CellarItemListRow
        {
            WineVintageId = vintageId,
            WineId = 43,
            Name = "Chardonnay Reserva",
            WineType = WineType.White,
            WineryName = "Catena Zapata",
            Year = 2022,
            Quantity = 0,
            LastChangeAt = DateTime.UtcNow
        };

        _itemRepository.UncorkAsync(userId, cellarId, vintageId, Arg.Any<CancellationToken>())
            .Returns(zeroRow);

        // Act
        var result = await _service.UncorkAsync(userId, cellarId, vintageId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.Quantity);
    }

    [Fact]
    public async Task UncorkAsync_WhenItemDoesNotExistOrHasZeroUnits_ThrowsConflictException()
    {
        // Arrange
        const int userId = 1;
        const int cellarId = 10;
        const int vintageId = 999;

        _cellarRepository.GetByIdAsync(cellarId, userId, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = cellarId, UserId = userId, Name = "Mi Cava" });

        _itemRepository.UncorkAsync(userId, cellarId, vintageId, Arg.Any<CancellationToken>())
            .Returns((CellarItemListRow?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            _service.UncorkAsync(userId, cellarId, vintageId));

        Assert.Contains("No quedan botellas", ex.Message);
    }

    [Fact]
    public async Task UncorkAsync_WhenCellarBelongsToAnotherUserOrNotFound_ThrowsNotFoundException()
    {
        // Arrange
        const int userId = 1;
        const int foreignCellarId = 99;
        const int vintageId = 100;

        _cellarRepository.GetByIdAsync(foreignCellarId, userId, Arg.Any<CancellationToken>())
            .Returns((Cellar?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.UncorkAsync(userId, foreignCellarId, vintageId));

        await _itemRepository.DidNotReceive().UncorkAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public void UserWineMappingExtensions_ToListItemDto_CorrectlyMapsWineryVintageAndImageUrl()
    {
        // Arrange
        var row = new UserWineListRow
        {
            WineId = 15,
            Name = "Angélica Zapata",
            WineType = WineType.Red,
            WineryId = 3,
            WineryNameText = "Catena",
            WineryName = "Bodega Catena Zapata",
            Vintage = 2019,
            ImageUrl = "/api/images/test-image-uuid?variant=bottle",
            RatingSum = 45,
            ReviewCount = 10,
            IsWanted = false,
            IsTried = true,
            IsFavorite = true,
            LastChangeAt = new DateTime(2026, 11, 13, 12, 0, 0, DateTimeKind.Utc)
        };

        // Act
        var dto = row.ToListItemDto();

        // Assert
        Assert.Equal(15, dto.WineId);
        Assert.Equal("Angélica Zapata", dto.Name);
        Assert.Equal("Bodega Catena Zapata", dto.WineryName);
        Assert.Equal(2019, dto.Vintage);
        Assert.Equal("/api/images/test-image-uuid?variant=bottle", dto.ImageUrl);
        Assert.True(dto.IsTried);
        Assert.True(dto.IsFavorite);
        Assert.False(dto.IsWanted);
        Assert.Equal(4.5m, dto.AverageRating);
    }
}
