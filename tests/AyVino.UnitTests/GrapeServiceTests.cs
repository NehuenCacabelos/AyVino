using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Grapes.DTOs;
using AyVino.Api.Features.Grapes.Enums;
using AyVino.Api.Features.Grapes.Models;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Grapes.Services;
using Npgsql;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace AyVino.UnitTests;

public class GrapeServiceTests
{
    private readonly IGrapeRepository _grapeRepo = Substitute.For<IGrapeRepository>();
    private readonly GrapeService _service;

    public GrapeServiceTests()
    {
        _service = new GrapeService(_grapeRepo);
    }

    [Fact]
    public async Task DeleteAsync_WhenRepositoryThrowsForeignKeyPostgresException_ThrowsConflictException()
    {
        // Arrange: Simular error de clave foránea 23503 desde Npgsql al borrar una uva en uso
        var pgException = new PostgresException(
            messageText: "update or delete on table \"grapes\" violates foreign key constraint \"fk_wine_grapes_grapes\" on table \"wine_grapes\"",
            severity: "ERROR",
            invariantSeverity: "ERROR",
            sqlState: PostgresErrorCodes.ForeignKeyViolation);

        _grapeRepo.DeleteAsync(1, Arg.Any<CancellationToken>())
            .ThrowsAsync(pgException);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() => _service.DeleteAsync(1));
        Assert.Equal("No se puede eliminar la uva porque está asociada a uno o más vinos.", ex.Message);
    }

    [Fact]
    public async Task DeleteAsync_WhenGrapeNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _grapeRepo.DeleteAsync(999, Arg.Any<CancellationToken>())
            .Returns(false);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _service.DeleteAsync(999));
    }

    [Fact]
    public async Task DeleteAsync_WhenGrapeExistsAndNotInUse_DeletesSuccessfully()
    {
        // Arrange
        _grapeRepo.DeleteAsync(42, Arg.Any<CancellationToken>())
            .Returns(true);

        // Act
        await _service.DeleteAsync(42);

        // Assert
        await _grapeRepo.Received(1).DeleteAsync(42, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetByIdAsync_WhenGrapeExists_ReturnsGrapeResponseDto()
    {
        // Arrange
        var grape = new Grape
        {
            Id = 10,
            Name = "Malbec",
            ColorType = ColorType.Red,
            TypicalBody = TypicalBody.Full,
            TypicalTannins = TypicalTannins.Medium,
            TypicalAcidity = TypicalAcidity.Medium
        };
        _grapeRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(grape);

        // Act
        var result = await _service.GetByIdAsync(10);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.Id);
        Assert.Equal("Malbec", result.Name);
        Assert.Equal("Red", result.ColorType);
    }

    [Fact]
    public async Task GetByIdAsync_WhenGrapeDoesNotExist_ThrowsNotFoundException()
    {
        // Arrange
        _grapeRepo.GetByIdAsync(999, Arg.Any<CancellationToken>())
            .Returns((Grape?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _service.GetByIdAsync(999));
    }
}
