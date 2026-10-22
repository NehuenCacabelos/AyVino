using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Cellars.Services;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using NSubstitute;

namespace AyVino.UnitTests;

public class CellarItemServiceTests
{
    private readonly ICellarRepository _cellarRepository = Substitute.For<ICellarRepository>();
    private readonly ICellarItemRepository _itemRepository = Substitute.For<ICellarItemRepository>();
    private readonly IWineVintageRepository _wineVintageRepository = Substitute.For<IWineVintageRepository>();
    private readonly CellarItemService _cellarItemService;

    public CellarItemServiceTests()
    {
        _cellarItemService = new CellarItemService(_cellarRepository, _itemRepository, _wineVintageRepository);
    }

    [Fact]
    public async Task AddAsync_ValidRequest_CreatesItemAndReturnsResponseDto()
    {
        // Arrange
        var cellar = new Cellar { Id = 10, UserId = 1, Name = "Mi Cava", CreatedAt = DateTime.UtcNow };
        _cellarRepository.GetByIdAsync(10, 1, Arg.Any<CancellationToken>()).Returns(cellar);
        _wineVintageRepository.ExistsByIdAsync(20, Arg.Any<CancellationToken>()).Returns(true);
        _itemRepository.GetAsync(10, 20, Arg.Any<CancellationToken>()).Returns((CellarItem?)null);

        var row = new CellarItemListRow
        {
            WineVintageId = 20,
            WineId = 1,
            Name = "Malbec Reserva",
            WineType = AyVino.Api.Features.Wines.Enums.WineType.Red,
            WineryId = 2,
            WineryNameText = "Bodega Bianchi",
            Year = 2020,
            Quantity = 3,
            PurchaseDate = new DateOnly(2023, 1, 1),
            Notes = "Comprado en viaje",
            LastChangeAt = DateTime.UtcNow
        };
        _itemRepository.GetRowAsync(10, 20, Arg.Any<CancellationToken>()).Returns(row);

        var request = new AddCellarItemRequestDto(20, 3, new DateOnly(2023, 1, 1), "Comprado en viaje");

        // Act
        var result = await _cellarItemService.AddAsync(1, 10, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(20, result.WineVintageId);
        Assert.Equal(3, result.Quantity);
        await _itemRepository.Received(1).CreateAsync(Arg.Is<CellarItem>(i => i.Quantity == 3 && i.CellarId == 10), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task AddAsync_CellarNotOwnedOrNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _cellarRepository.GetByIdAsync(10, 1, Arg.Any<CancellationToken>()).Returns((Cellar?)null);
        var request = new AddCellarItemRequestDto(20, 3, null, null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _cellarItemService.AddAsync(1, 10, request));
        await _itemRepository.DidNotReceive().CreateAsync(Arg.Any<CellarItem>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task AddAsync_VintageNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var cellar = new Cellar { Id = 10, UserId = 1, Name = "Mi Cava", CreatedAt = DateTime.UtcNow };
        _cellarRepository.GetByIdAsync(10, 1, Arg.Any<CancellationToken>()).Returns(cellar);
        _wineVintageRepository.ExistsByIdAsync(999, Arg.Any<CancellationToken>()).Returns(false);

        var request = new AddCellarItemRequestDto(999, 3, null, null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() => _cellarItemService.AddAsync(1, 10, request));
        Assert.Contains("Cosecha con ID 999 no encontrada", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task AddAsync_VintageAlreadyInCellar_ThrowsConflictException()
    {
        // Arrange
        var cellar = new Cellar { Id = 10, UserId = 1, Name = "Mi Cava", CreatedAt = DateTime.UtcNow };
        _cellarRepository.GetByIdAsync(10, 1, Arg.Any<CancellationToken>()).Returns(cellar);
        _wineVintageRepository.ExistsByIdAsync(20, Arg.Any<CancellationToken>()).Returns(true);
        _itemRepository.GetAsync(10, 20, Arg.Any<CancellationToken>())
            .Returns(new CellarItem { CellarId = 10, WineVintageId = 20, Quantity = 2, CreatedAt = DateTime.UtcNow });

        var request = new AddCellarItemRequestDto(20, 3, null, null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() => _cellarItemService.AddAsync(1, 10, request));
        Assert.Contains("ya está en la cava", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(1000)]
    public async Task AddAsync_InvalidQuantity_ThrowsValidationException(int quantity)
    {
        // Arrange
        var request = new AddCellarItemRequestDto(20, quantity, null, null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _cellarItemService.AddAsync(1, 10, request));
        Assert.Contains("cantidad debe estar entre 1 y 999", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task AddAsync_FuturePurchaseDate_ThrowsValidationException()
    {
        // Arrange
        var futureDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5));
        var request = new AddCellarItemRequestDto(20, 2, futureDate, null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _cellarItemService.AddAsync(1, 10, request));
        Assert.Contains("fecha de compra no puede ser futura", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UpdateAsync_ValidQuantity_ReplacesQuantitySuccessfully()
    {
        // Arrange
        var cellar = new Cellar { Id = 10, UserId = 1, Name = "Mi Cava", CreatedAt = DateTime.UtcNow };
        _cellarRepository.GetByIdAsync(10, 1, Arg.Any<CancellationToken>()).Returns(cellar);
        _itemRepository.UpdateAsync(10, 20, 5, null, null, Arg.Any<CancellationToken>()).Returns(true);

        var row = new CellarItemListRow
        {
            WineVintageId = 20,
            WineId = 1,
            Name = "Malbec",
            WineType = AyVino.Api.Features.Wines.Enums.WineType.Red,
            Year = 2020,
            Quantity = 5,
            LastChangeAt = DateTime.UtcNow
        };
        _itemRepository.GetRowAsync(10, 20, Arg.Any<CancellationToken>()).Returns(row);

        var request = new UpdateCellarItemRequestDto(5, null, null);

        // Act
        var result = await _cellarItemService.UpdateAsync(1, 10, 20, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Quantity);
        await _itemRepository.Received(1).UpdateAsync(10, 20, 5, null, null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAsync_ItemNotInCellar_ThrowsNotFoundException()
    {
        // Arrange
        var cellar = new Cellar { Id = 10, UserId = 1, Name = "Mi Cava", CreatedAt = DateTime.UtcNow };
        _cellarRepository.GetByIdAsync(10, 1, Arg.Any<CancellationToken>()).Returns(cellar);
        _itemRepository.UpdateAsync(10, 20, 5, null, null, Arg.Any<CancellationToken>()).Returns(false);

        var request = new UpdateCellarItemRequestDto(5, null, null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _cellarItemService.UpdateAsync(1, 10, 20, request));
    }

    [Fact]
    public async Task RemoveAsync_ItemExists_DeletesSuccessfully()
    {
        // Arrange
        var cellar = new Cellar { Id = 10, UserId = 1, Name = "Mi Cava", CreatedAt = DateTime.UtcNow };
        _cellarRepository.GetByIdAsync(10, 1, Arg.Any<CancellationToken>()).Returns(cellar);
        _itemRepository.DeleteAsync(10, 20, Arg.Any<CancellationToken>()).Returns(true);

        // Act
        await _cellarItemService.RemoveAsync(1, 10, 20);

        // Assert
        await _itemRepository.Received(1).DeleteAsync(10, 20, Arg.Any<CancellationToken>());
    }
}
