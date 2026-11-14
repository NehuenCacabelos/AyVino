using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Cellars.Services;
using AyVino.Api.Features.UserWines.DTOs;
using AyVino.Api.Features.UserWines.Models;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Repositories;
using NSubstitute;
using Xunit;

namespace AyVino.UnitTests;

public class UsuarioBloqueU11Tests
{
    private readonly ICellarRepository _cellarRepository = Substitute.For<ICellarRepository>();
    private readonly ICellarItemRepository _itemRepository = Substitute.For<ICellarItemRepository>();
    private readonly CellarItemService _service;

    public UsuarioBloqueU11Tests()
    {
        _service = new CellarItemService(_cellarRepository, _itemRepository, Substitute.For<IWineVintageRepository>());
    }

    [Fact]
    public async Task UncorkAsync_WithNewReview_CallsRepositoryWithRatingAndComment()
    {
        // Arrange
        const int userId = 1;
        const int cellarId = 10;
        const int vintageId = 100;
        var request = new UncorkCellarItemRequestDto(Rating: 5, Comment: "Excelente equilibrio y taninos pulidos.");

        _cellarRepository.GetByIdAsync(cellarId, userId, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = cellarId, UserId = userId, Name = "Mi Cava" });

        var updatedRow = new CellarItemListRow
        {
            WineVintageId = vintageId,
            WineId = 42,
            Name = "Gran Reserva Malbec",
            WineType = WineType.Red,
            WineryName = "Bodega Zuccardi",
            Year = 2020,
            Quantity = 3,
            LastChangeAt = DateTime.UtcNow
        };

        _itemRepository.UncorkAsync(userId, cellarId, vintageId, 5, "Excelente equilibrio y taninos pulidos.", Arg.Any<CancellationToken>())
            .Returns(updatedRow);

        // Act
        var result = await _service.UncorkAsync(userId, cellarId, vintageId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(vintageId, result.WineVintageId);
        Assert.Equal(3, result.Quantity);
        await _itemRepository.Received(1).UncorkAsync(userId, cellarId, vintageId, 5, "Excelente equilibrio y taninos pulidos.", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UncorkAsync_WithExistingReview_CallsRepositoryWithRatingAndCommentForUpdate()
    {
        // Arrange
        const int userId = 1;
        const int cellarId = 10;
        const int vintageId = 100;
        var request = new UncorkCellarItemRequestDto(Rating: 4, Comment: "Segunda botella, notas terciarias más presentes.");

        _cellarRepository.GetByIdAsync(cellarId, userId, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = cellarId, UserId = userId, Name = "Mi Cava" });

        var updatedRow = new CellarItemListRow
        {
            WineVintageId = vintageId,
            WineId = 42,
            Name = "Gran Reserva Malbec",
            WineType = WineType.Red,
            WineryName = "Bodega Zuccardi",
            Year = 2020,
            Quantity = 2,
            LastChangeAt = DateTime.UtcNow
        };

        _itemRepository.UncorkAsync(userId, cellarId, vintageId, 4, "Segunda botella, notas terciarias más presentes.", Arg.Any<CancellationToken>())
            .Returns(updatedRow);

        // Act
        var result = await _service.UncorkAsync(userId, cellarId, vintageId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Quantity);
        await _itemRepository.Received(1).UncorkAsync(userId, cellarId, vintageId, 4, "Segunda botella, notas terciarias más presentes.", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UncorkAsync_WithoutReview_CallsRepositoryWithoutRatingAndComment()
    {
        // Arrange
        const int userId = 1;
        const int cellarId = 10;
        const int vintageId = 101;

        _cellarRepository.GetByIdAsync(cellarId, userId, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = cellarId, UserId = userId, Name = "Mi Cava" });

        var updatedRow = new CellarItemListRow
        {
            WineVintageId = vintageId,
            WineId = 43,
            Name = "Chardonnay",
            WineType = WineType.White,
            WineryName = "Catena Zapata",
            Year = 2021,
            Quantity = 1,
            LastChangeAt = DateTime.UtcNow
        };

        _itemRepository.UncorkAsync(userId, cellarId, vintageId, Arg.Any<CancellationToken>())
            .Returns(updatedRow);

        // Act
        var result = await _service.UncorkAsync(userId, cellarId, vintageId, null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Quantity);
        await _itemRepository.Received(1).UncorkAsync(userId, cellarId, vintageId, Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    [InlineData(-1)]
    public async Task UncorkAsync_WithInvalidRating_ThrowsValidationException_WithoutCallingRepository(int invalidRating)
    {
        // Arrange
        const int userId = 1;
        const int cellarId = 10;
        const int vintageId = 100;
        var request = new UncorkCellarItemRequestDto(Rating: invalidRating, Comment: "Comentario");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.UncorkAsync(userId, cellarId, vintageId, request));

        Assert.Equal("El rating debe estar entre 1 y 5.", ex.Message);
        await _cellarRepository.DidNotReceive().GetByIdAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
        await _itemRepository.DidNotReceive().UncorkAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<int>(), Arg.Any<int?>(), Arg.Any<string?>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UncorkAsync_WithTooLongComment_ThrowsValidationException_WithoutCallingRepository()
    {
        // Arrange
        const int userId = 1;
        const int cellarId = 10;
        const int vintageId = 100;
        var tooLongComment = new string('A', 1001);
        var request = new UncorkCellarItemRequestDto(Rating: 5, Comment: tooLongComment);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.UncorkAsync(userId, cellarId, vintageId, request));

        Assert.Equal("El comentario no puede superar los 1000 caracteres.", ex.Message);
        await _cellarRepository.DidNotReceive().GetByIdAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
        await _itemRepository.DidNotReceive().UncorkAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<int>(), Arg.Any<int?>(), Arg.Any<string?>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UncorkAsync_WhenNoStock_ThrowsConflictException()
    {
        // Arrange
        const int userId = 1;
        const int cellarId = 10;
        const int vintageId = 100;
        var request = new UncorkCellarItemRequestDto(Rating: 5, Comment: "Buena cata");

        _cellarRepository.GetByIdAsync(cellarId, userId, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = cellarId, UserId = userId, Name = "Mi Cava" });

        _itemRepository.UncorkAsync(userId, cellarId, vintageId, 5, "Buena cata", Arg.Any<CancellationToken>())
            .Returns((CellarItemListRow?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            _service.UncorkAsync(userId, cellarId, vintageId, request));

        Assert.Contains("No quedan botellas", ex.Message);
    }

    [Fact]
    public async Task UncorkAsync_WhenForeignCellar_ThrowsNotFoundException()
    {
        // Arrange
        const int userId = 1;
        const int foreignCellarId = 999;
        const int vintageId = 100;
        var request = new UncorkCellarItemRequestDto(Rating: 5, Comment: "Buena cata");

        _cellarRepository.GetByIdAsync(foreignCellarId, userId, Arg.Any<CancellationToken>())
            .Returns((Cellar?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.UncorkAsync(userId, foreignCellarId, vintageId, request));

        await _itemRepository.DidNotReceive().UncorkAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<int>(), Arg.Any<int?>(), Arg.Any<string?>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public void UserWineMappingExtensions_ToListItemDto_CorrectlyMapsUserRatingAndUserComment()
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
            LastChangeAt = new DateTime(2026, 11, 14, 10, 0, 0, DateTimeKind.Utc),
            UserRating = 5,
            UserComment = "Memorable descorche en familia."
        };

        // Act
        var dto = row.ToListItemDto();

        // Assert
        Assert.Equal(15, dto.WineId);
        Assert.Equal("Angélica Zapata", dto.Name);
        Assert.Equal(5, dto.UserRating);
        Assert.Equal("Memorable descorche en familia.", dto.UserComment);
        Assert.True(dto.IsTried);
        Assert.Equal(new DateTime(2026, 11, 14, 10, 0, 0, DateTimeKind.Utc), dto.LastChangeAt);
    }

    [Fact]
    public void UserRepository_GetPublicProfileByUsernameSql_FiltersCellarItemsWithPositiveQuantity()
    {
        var repoType = typeof(AyVino.Api.Features.Users.Repositories.UserRepository);
        var sourceFilePath = Path.Combine(AppContext.BaseDirectory, "../../../../../src/backend/AyVino.Api/Features/Users/Repositories/UserRepository.cs");
        if (File.Exists(sourceFilePath))
        {
            var content = File.ReadAllText(sourceFilePath);
            Assert.Contains("WHERE c.user_id = u.id AND ci.quantity > 0", content);
        }
    }
}
