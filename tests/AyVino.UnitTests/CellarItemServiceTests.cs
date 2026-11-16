using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Cellars.Services;
using AyVino.Api.Features.Grapes.Enums;
using AyVino.Api.Features.Grapes.Models;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using NSubstitute;

namespace AyVino.UnitTests;

public class CellarItemServiceTests
{
    private readonly ICellarRepository _cellarRepository = Substitute.For<ICellarRepository>();
    private readonly ICellarItemRepository _itemRepository = Substitute.For<ICellarItemRepository>();
    private readonly IWineVintageRepository _wineVintageRepository = Substitute.For<IWineVintageRepository>();
    private readonly IWineRepository _wineRepository = Substitute.For<IWineRepository>();
    private readonly IGrapeRepository _grapeRepository = Substitute.For<IGrapeRepository>();
    private readonly CellarItemService _cellarItemService;

    public CellarItemServiceTests()
    {
        _cellarItemService = new CellarItemService(_cellarRepository, _itemRepository, _wineVintageRepository, _wineRepository, _grapeRepository);
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

    [Fact]
    public async Task GetPublicCellarItemsAsync_ValidRequest_ReturnsMappedPublicDtos()
    {
        // Arrange
        var rows = new List<CellarItemListRow>
        {
            new()
            {
                WineVintageId = 1,
                WineId = 101,
                Name = "Gran Malbec",
                WineType = (AyVino.Api.Features.Wines.Enums.WineType)1,
                WineryId = 5,
                WineryNameText = "Catena",
                Year = 2020,
                ImageId = Guid.NewGuid(),
                RatingSum = 45,
                ReviewCount = 10,
                Quantity = 3
            }
        };

        _itemRepository.GetAllByUsernameAsync("sommelier", 1, 10, Arg.Any<CancellationToken>())
            .Returns(rows);

        // Act
        var result = await _cellarItemService.GetPublicCellarItemsAsync("sommelier", 1, 10);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal("Gran Malbec", result[0].Name);
        Assert.Equal("Catena", result[0].WineryNameText);
        Assert.Equal(4.5m, result[0].AverageRating);
        await _itemRepository.Received(1).GetAllByUsernameAsync("sommelier", 1, 10, Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task GetPublicCellarItemsAsync_InvalidUsername_ThrowsNotFoundException(string? username)
    {
        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _cellarItemService.GetPublicCellarItemsAsync(username!, 1, 10));
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(1, 0)]
    [InlineData(1, 101)]
    public async Task GetPublicCellarItemsAsync_InvalidPagination_ThrowsValidationException(int page, int size)
    {
        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _cellarItemService.GetPublicCellarItemsAsync("sommelier", page, size));
    }

    [Fact]
    public async Task QuickAddAsync_NewCommunityWine_CreatesWineAndVintageAndAddsToCellar()
    {
        // Arrange
        var cellar = new Cellar { Id = 10, UserId = 1, Name = "Mi Cava", CreatedAt = DateTime.UtcNow };
        _cellarRepository.GetByIdAsync(10, 1, Arg.Any<CancellationToken>()).Returns(cellar);

        var createdWine = new Wine { Id = 50, Name = "Vino Comunitario", WineType = AyVino.Api.Features.Wines.Enums.WineType.Red, SourceType = AyVino.Api.Features.Wines.Enums.SourceType.Community };
        _wineRepository.CreateWithFirstVintageAsync(Arg.Any<Wine>(), Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>())
            .Returns(createdWine);

        var vintage = new WineVintage { Id = 100, WineId = 50, Year = 2021 };
        _wineVintageRepository.GetAllByWineIdAsync(50, Arg.Any<CancellationToken>())
            .Returns(new[] { vintage });

        _itemRepository.GetAsync(10, 100, Arg.Any<CancellationToken>()).Returns((CellarItem?)null);

        var row = new CellarItemListRow
        {
            WineVintageId = 100,
            WineId = 50,
            Name = "Vino Comunitario",
            WineType = AyVino.Api.Features.Wines.Enums.WineType.Red,
            WineryNameText = "Bodega Garage",
            Year = 2021,
            Quantity = 2,
            Notes = "[A1] Botella guardada",
            LastChangeAt = DateTime.UtcNow
        };
        _itemRepository.GetRowAsync(10, 100, Arg.Any<CancellationToken>()).Returns(row);
        _grapeRepository.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(new Grape { Id = 1, Name = "Malbec", ColorType = ColorType.Red });

        var request = new QuickAddCellarWineRequestDto(
            Name: "Vino Comunitario",
            WineryName: "Bodega Garage",
            WineType: "Red",
            Year: 2021,
            Quantity: 2,
            Location: "A1",
            Notes: "Botella guardada",
            MainGrapeId: 1);

        // Act
        var result = await _cellarItemService.QuickAddAsync(1, 10, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(100, result.WineVintageId);
        Assert.Equal(50, result.WineId);
        Assert.Equal(2, result.Quantity);
        await _wineRepository.Received(1).CreateWithFirstVintageAsync(
            Arg.Is<Wine>(w => w.SourceType == AyVino.Api.Features.Wines.Enums.SourceType.Community && w.WineryNameText == "Bodega Garage"),
            Arg.Is<WineVintage>(v => v.Year == 2021),
            Arg.Any<IEnumerable<WineGrape>>(),
            Arg.Any<CancellationToken>());
        await _itemRepository.Received(1).CreateAsync(
            Arg.Is<CellarItem>(ci => ci.CellarId == 10 && ci.WineVintageId == 100 && ci.Quantity == 2),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task QuickAddAsync_MatchedExistingWine_ExistingVintage_IncrementsQuantity()
    {
        // Arrange
        var cellar = new Cellar { Id = 10, UserId = 1, Name = "Mi Cava", CreatedAt = DateTime.UtcNow };
        _cellarRepository.GetByIdAsync(10, 1, Arg.Any<CancellationToken>()).Returns(cellar);

        var existingWine = new Wine { Id = 50, Name = "Catena Zapata", WineType = AyVino.Api.Features.Wines.Enums.WineType.Red, SourceType = AyVino.Api.Features.Wines.Enums.SourceType.Official };
        _wineRepository.GetByIdAsync(50, Arg.Any<CancellationToken>()).Returns(existingWine);

        var existingVintage = new WineVintage { Id = 100, WineId = 50, Year = 2020 };
        _wineVintageRepository.GetAllByWineIdAsync(50, Arg.Any<CancellationToken>()).Returns(new[] { existingVintage });

        var existingItem = new CellarItem { CellarId = 10, WineVintageId = 100, Quantity = 2, Notes = "Estante 1" };
        _itemRepository.GetAsync(10, 100, Arg.Any<CancellationToken>()).Returns(existingItem);

        var row = new CellarItemListRow
        {
            WineVintageId = 100,
            WineId = 50,
            Name = "Catena Zapata",
            WineType = AyVino.Api.Features.Wines.Enums.WineType.Red,
            WineryNameText = "Catena Zapata",
            Year = 2020,
            Quantity = 5,
            LastChangeAt = DateTime.UtcNow
        };
        _itemRepository.GetRowAsync(10, 100, Arg.Any<CancellationToken>()).Returns(row);

        var request = new QuickAddCellarWineRequestDto(
            Name: "Catena Zapata",
            WineryName: "Catena Zapata",
            WineType: "Red",
            Year: 2020,
            Quantity: 3,
            MatchedWineId: 50);

        // Act
        var result = await _cellarItemService.QuickAddAsync(1, 10, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Quantity);
        await _itemRepository.Received(1).UpdateAsync(10, 100, 5, Arg.Any<DateOnly?>(), Arg.Any<string?>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task QuickAddAsync_NoCellarExists_CreatesDefaultCellarFirst()
    {
        // Arrange
        _cellarRepository.GetAllByUserAsync(1, 1, 1, Arg.Any<CancellationToken>())
            .Returns(Enumerable.Empty<CellarSummaryRow>());
        _cellarRepository.CreateAsync(1, "Mi Cava", Arg.Any<CancellationToken>())
            .Returns(99);

        var createdWine = new Wine { Id = 60, Name = "Malbec Joven", WineType = AyVino.Api.Features.Wines.Enums.WineType.Red, SourceType = AyVino.Api.Features.Wines.Enums.SourceType.Community };
        _wineRepository.CreateWithFirstVintageAsync(Arg.Any<Wine>(), Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>())
            .Returns(createdWine);

        var vintage = new WineVintage { Id = 120, WineId = 60, Year = 2023 };
        _wineVintageRepository.GetAllByWineIdAsync(60, Arg.Any<CancellationToken>()).Returns(new[] { vintage });
        _itemRepository.GetAsync(99, 120, Arg.Any<CancellationToken>()).Returns((CellarItem?)null);

        var row = new CellarItemListRow
        {
            WineVintageId = 120,
            WineId = 60,
            Name = "Malbec Joven",
            WineType = AyVino.Api.Features.Wines.Enums.WineType.Red,
            Quantity = 1,
            LastChangeAt = DateTime.UtcNow
        };
        _itemRepository.GetRowAsync(99, 120, Arg.Any<CancellationToken>()).Returns(row);
        _grapeRepository.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(new Grape { Id = 1, Name = "Malbec", ColorType = ColorType.Red });

        var request = new QuickAddCellarWineRequestDto("Malbec Joven", "Bodega Nueva", "Red", 2023, 1, MainGrapeId: 1);

        // Act
        var result = await _cellarItemService.QuickAddAsync(1, null, request);

        // Assert
        Assert.NotNull(result);
        await _cellarRepository.Received(1).CreateAsync(1, "Mi Cava", Arg.Any<CancellationToken>());
        await _itemRepository.Received(1).CreateAsync(Arg.Is<CellarItem>(ci => ci.CellarId == 99 && ci.WineVintageId == 120), Arg.Any<CancellationToken>());
    }
}
