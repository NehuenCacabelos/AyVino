using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.History.Services;
using AyVino.Api.Features.Reviews.Repositories;
using AyVino.Api.Features.Uncorks.DTOs;
using AyVino.Api.Features.Uncorks.Services;
using AyVino.Api.Features.UserWines.Repositories;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using NSubstitute;

namespace AyVino.UnitTests;

public class CommunityWineBlock8Tests
{
    private readonly IWineVintageRepository _vintageRepo = Substitute.For<IWineVintageRepository>();
    private readonly ICellarRepository _cellarRepo = Substitute.For<ICellarRepository>();
    private readonly IUncorkTransactionRunner _runner = Substitute.For<IUncorkTransactionRunner>();

    private UncorkService CreateSut() =>
        new(_vintageRepo, _cellarRepo, _runner);

    [Fact]
    public async Task UncorkAsync_DirectWithoutCellar_CallsTransactionRunnerWithoutCellarId()
    {
        // Arrange
        _vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 5, ApprovalStatus = ApprovalStatus.Approved });

        _runner.ExecuteAsync(1, 5, 10, null, null, null, Arg.Any<CancellationToken>())
            .Returns(new UncorkExecutionResult(ActivityId: 999, RemainingQuantity: null, ReviewId: null, ReviewCreated: false));

        var sut = CreateSut();
        var request = new UncorkRequestDto(WineVintageId: 10);

        // Act
        var result = await sut.UncorkAsync(1, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(999, result.ActivityId);
        Assert.Null(result.RemainingQuantity);
        Assert.Null(result.ReviewId);
        await _cellarRepo.DidNotReceiveWithAnyArgs().GetByIdAsync(default, default, Arg.Any<CancellationToken>());
        await _runner.Received(1).ExecuteAsync(1, 5, 10, null, null, null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UncorkAsync_WithCellar_VerifiesOwnershipAndCallsRunner()
    {
        // Arrange
        _vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 5, ApprovalStatus = ApprovalStatus.Pending });

        _cellarRepo.GetByIdAsync(2, 1, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = 2, UserId = 1, Name = "Mi Cava" });

        _runner.ExecuteAsync(1, 5, 10, 2, 4, "Rico vino", Arg.Any<CancellationToken>())
            .Returns(new UncorkExecutionResult(ActivityId: 1001, RemainingQuantity: 3, ReviewId: 77, ReviewCreated: true));

        var sut = CreateSut();
        var request = new UncorkRequestDto(WineVintageId: 10, CellarId: 2, Rating: 4, Comment: "Rico vino");

        // Act
        var result = await sut.UncorkAsync(1, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1001, result.ActivityId);
        Assert.Equal(3, result.RemainingQuantity);
        Assert.Equal(77, result.ReviewId);
        await _cellarRepo.Received(1).GetByIdAsync(2, 1, Arg.Any<CancellationToken>());
        await _runner.Received(1).ExecuteAsync(1, 5, 10, 2, 4, "Rico vino", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UncorkAsync_WhenCellarNotOwnedByUser_ThrowsNotFoundException()
    {
        // Arrange
        _vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 5, ApprovalStatus = ApprovalStatus.Approved });

        _cellarRepo.GetByIdAsync(99, 1, Arg.Any<CancellationToken>())
            .Returns((Cellar?)null);

        var sut = CreateSut();
        var request = new UncorkRequestDto(WineVintageId: 10, CellarId: 99);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            sut.UncorkAsync(1, request));

        Assert.Contains("Cava con ID 99 no encontrada", ex.Message);
        await _runner.DidNotReceiveWithAnyArgs().ExecuteAsync(default, default, default, default, default, default, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UncorkAsync_WhenVintageNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _vintageRepo.GetByIdAsync(999, Arg.Any<CancellationToken>())
            .Returns((WineVintage?)null);

        var sut = CreateSut();
        var request = new UncorkRequestDto(WineVintageId: 999);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            sut.UncorkAsync(1, request));

        Assert.Contains("Cosecha con ID 999 no encontrada", ex.Message);
    }

    [Fact]
    public async Task UncorkAsync_WhenVintageRejected_ThrowsValidationException()
    {
        // Arrange
        _vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 5, ApprovalStatus = ApprovalStatus.Rejected });

        var sut = CreateSut();
        var request = new UncorkRequestDto(WineVintageId: 10);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            sut.UncorkAsync(1, request));

        Assert.Contains("rechazada", ex.Message);
    }

    [Fact]
    public async Task UncorkAsync_CommentWithoutRating_ThrowsValidationException()
    {
        var sut = CreateSut();
        var request = new UncorkRequestDto(WineVintageId: 10, Rating: null, Comment: "Sin puntaje");

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            sut.UncorkAsync(1, request));

        Assert.Contains("comentario sin puntaje", ex.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public async Task UncorkAsync_RatingOutOfBounds_ThrowsValidationException(int rating)
    {
        var sut = CreateSut();
        var request = new UncorkRequestDto(WineVintageId: 10, Rating: rating);

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            sut.UncorkAsync(1, request));

        Assert.Contains("puntaje", ex.Message);
    }

    [Fact]
    public async Task UncorkAsync_CommentTooLong_ThrowsValidationException()
    {
        var sut = CreateSut();
        var request = new UncorkRequestDto(WineVintageId: 10, Rating: 5, Comment: new string('A', 1001));

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            sut.UncorkAsync(1, request));

        Assert.Contains("1000", ex.Message);
    }

    [Theory]
    [InlineData(0, null)]
    [InlineData(-1, null)]
    [InlineData(1, 0)]
    [InlineData(1, -5)]
    public async Task UncorkAsync_InvalidIds_ThrowsValidationException(int wineVintageId, int? cellarId)
    {
        var sut = CreateSut();
        var request = new UncorkRequestDto(WineVintageId: wineVintageId, CellarId: cellarId);

        await Assert.ThrowsAsync<ValidationException>(() =>
            sut.UncorkAsync(1, request));
    }

    [Fact]
    public void UncorkTransactionRunner_Constructor_InstantiatesCorrectly()
    {
        var userWineRepo = Substitute.For<IUserWineRepository>();
        var reviewRepo = Substitute.For<IReviewRepository>();
        var activityRecorder = Substitute.For<IActivityRecorder>();

        var runner = new UncorkTransactionRunner(null!, userWineRepo, reviewRepo, activityRecorder);
        Assert.NotNull(runner);
    }
}
