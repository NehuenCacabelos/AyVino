using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Cellars.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class CellarServiceTests
{
    private readonly ICellarRepository _cellarRepository = Substitute.For<ICellarRepository>();
    private readonly CellarService _cellarService;

    public CellarServiceTests()
    {
        _cellarService = new CellarService(_cellarRepository);
    }

    [Fact]
    public async Task GetByIdAsync_CellarExistsAndBelongsToUser_ReturnsResponseDto()
    {
        // Arrange
        var summary = new CellarSummaryRow
        {
            Id = 5,
            Name = "Mi Cava Privada",
            CreatedAt = DateTime.UtcNow,
            BottleCount = 12,
            VintageCount = 4
        };
        _cellarRepository.GetSummaryByIdAsync(5, 1, Arg.Any<CancellationToken>()).Returns(summary);

        // Act
        var result = await _cellarService.GetByIdAsync(1, 5);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Id);
        Assert.Equal("Mi Cava Privada", result.Name);
        Assert.Equal(12, result.BottleCount);
        Assert.Equal(4, result.VintageCount);
    }

    [Fact]
    public async Task GetByIdAsync_CellarNotFoundOrBelongsToAnotherUser_ThrowsNotFoundException()
    {
        // Arrange
        _cellarRepository.GetSummaryByIdAsync(5, 2, Arg.Any<CancellationToken>()).Returns((CellarSummaryRow?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() => _cellarService.GetByIdAsync(2, 5));
        Assert.Contains("Cava con ID 5 no encontrada", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateAsync_DuplicateNameForSameUser_ThrowsConflictException()
    {
        // Arrange
        _cellarRepository.ExistsByNameAsync(1, "Mi Cava", null, Arg.Any<CancellationToken>()).Returns(true);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            _cellarService.CreateAsync(1, new CreateCellarRequestDto("Mi Cava")));
        Assert.Contains("Ya tenés una cava llamada", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateAsync_InvalidName_ThrowsValidationException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() =>
            _cellarService.CreateAsync(1, new CreateCellarRequestDto("   ")));
    }

    [Fact]
    public async Task RenameAsync_CellarNotFoundOrBelongsToAnotherUser_ThrowsNotFoundException()
    {
        // Arrange
        _cellarRepository.GetByIdAsync(5, 1, Arg.Any<CancellationToken>()).Returns((Cellar?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _cellarService.RenameAsync(1, 5, new UpdateCellarRequestDto("Nuevo Nombre")));
    }

    [Fact]
    public async Task RenameAsync_DuplicateName_ThrowsConflictException()
    {
        // Arrange
        var cellar = new Cellar { Id = 5, UserId = 1, Name = "Cava Antigua", CreatedAt = DateTime.UtcNow };
        _cellarRepository.GetByIdAsync(5, 1, Arg.Any<CancellationToken>()).Returns(cellar);
        _cellarRepository.ExistsByNameAsync(1, "Nuevo Nombre", 5, Arg.Any<CancellationToken>()).Returns(true);

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(() =>
            _cellarService.RenameAsync(1, 5, new UpdateCellarRequestDto("Nuevo Nombre")));
    }

    [Fact]
    public async Task DeleteAsync_CellarHasBottles_ThrowsConflictException()
    {
        // Arrange
        var cellar = new Cellar { Id = 5, UserId = 1, Name = "Cava Llena", CreatedAt = DateTime.UtcNow };
        _cellarRepository.GetByIdAsync(5, 1, Arg.Any<CancellationToken>()).Returns(cellar);
        _cellarRepository.HasItemsAsync(5, Arg.Any<CancellationToken>()).Returns(true);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() => _cellarService.DeleteAsync(1, 5));
        Assert.Contains("todavía tiene botellas", ex.Message, StringComparison.OrdinalIgnoreCase);
        await _cellarRepository.DidNotReceive().DeleteAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteAsync_CellarNotFoundOrBelongsToAnotherUser_ThrowsNotFoundException()
    {
        // Arrange
        _cellarRepository.GetByIdAsync(5, 1, Arg.Any<CancellationToken>()).Returns((Cellar?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _cellarService.DeleteAsync(1, 5));
        await _cellarRepository.DidNotReceive().DeleteAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteAsync_EmptyCellarOwnedByUser_DeletesSuccessfully()
    {
        // Arrange
        var cellar = new Cellar { Id = 5, UserId = 1, Name = "Cava Vacía", CreatedAt = DateTime.UtcNow };
        _cellarRepository.GetByIdAsync(5, 1, Arg.Any<CancellationToken>()).Returns(cellar);
        _cellarRepository.HasItemsAsync(5, Arg.Any<CancellationToken>()).Returns(false);
        _cellarRepository.DeleteAsync(5, 1, Arg.Any<CancellationToken>()).Returns(true);

        // Act
        await _cellarService.DeleteAsync(1, 5);

        // Assert
        await _cellarRepository.Received(1).DeleteAsync(5, 1, Arg.Any<CancellationToken>());
    }
}
