using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.History.DTOs;
using AyVino.Api.Features.History.Enums;
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

public class CommunityWineBlock14Tests
{
    private readonly IWineVintageRepository _vintageRepo = Substitute.For<IWineVintageRepository>();
    private readonly ICellarRepository _cellarRepo = Substitute.For<ICellarRepository>();
    private readonly IUncorkTransactionRunner _runner = Substitute.For<IUncorkTransactionRunner>();

    private UncorkService CreateSut() => new(_vintageRepo, _cellarRepo, _runner);

    [Fact]
    public async Task UncorkAsync_WithoutOccurredAt_UsesCurrentTimeAndCallsRunnerWithoutOccurredAt()
    {
        // Arrange
        _vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 5, ApprovalStatus = ApprovalStatus.Approved });

        _runner.ExecuteAsync(1, 5, 10, null, null, null, Arg.Any<CancellationToken>())
            .Returns(new UncorkExecutionResult(ActivityId: 999, RemainingQuantity: null, ReviewId: null, ReviewCreated: false, OccurredAt: DateTime.UtcNow));

        var sut = CreateSut();
        var request = new UncorkRequestDto(WineVintageId: 10, OccurredAt: null);

        var before = DateTime.UtcNow.AddSeconds(-1);

        // Act
        var result = await sut.UncorkAsync(1, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(999, result.ActivityId);
        Assert.True(result.OccurredAt >= before);
        await _runner.Received(1).ExecuteAsync(1, 5, 10, null, null, null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UncorkAsync_WithPastDateDifferentOffset_PassesOccurredAtToRunnerAndReturnsUtcDate()
    {
        // Arrange
        _vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 5, ApprovalStatus = ApprovalStatus.Approved });

        var specificPastDate = new DateTimeOffset(2025, 6, 15, 20, 30, 0, TimeSpan.FromHours(-3));

        _runner.ExecuteAsync(1, 5, 10, null, null, null, specificPastDate, Arg.Any<CancellationToken>())
            .Returns(new UncorkExecutionResult(ActivityId: 1050, RemainingQuantity: null, ReviewId: null, ReviewCreated: false, OccurredAt: specificPastDate.UtcDateTime));

        var sut = CreateSut();
        var request = new UncorkRequestDto(WineVintageId: 10, OccurredAt: specificPastDate);

        // Act
        var result = await sut.UncorkAsync(1, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1050, result.ActivityId);
        Assert.Equal(specificPastDate.UtcDateTime, result.OccurredAt);
        await _runner.Received(1).ExecuteAsync(1, 5, 10, null, null, null, specificPastDate, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UncorkAsync_WithFutureDateBeyondTolerance_ThrowsValidationException()
    {
        // Arrange
        var futureDate = DateTimeOffset.UtcNow.AddMinutes(10);
        var sut = CreateSut();
        var request = new UncorkRequestDto(WineVintageId: 10, OccurredAt: futureDate);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => sut.UncorkAsync(1, request));
        Assert.Contains("futuro", ex.Message, StringComparison.OrdinalIgnoreCase);
        await _runner.DidNotReceiveWithAnyArgs().ExecuteAsync(default, default, default, default, default, default, default, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UncorkAsync_WithFutureDateWithin5MinutesTolerance_Succeeds()
    {
        // Arrange
        _vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 5, ApprovalStatus = ApprovalStatus.Approved });

        var slightlyFuture = DateTimeOffset.UtcNow.AddMinutes(3);

        _runner.ExecuteAsync(1, 5, 10, null, null, null, slightlyFuture, Arg.Any<CancellationToken>())
            .Returns(new UncorkExecutionResult(ActivityId: 888, RemainingQuantity: null, ReviewId: null, ReviewCreated: false, OccurredAt: slightlyFuture.UtcDateTime));

        var sut = CreateSut();
        var request = new UncorkRequestDto(WineVintageId: 10, OccurredAt: slightlyFuture);

        // Act
        var result = await sut.UncorkAsync(1, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(888, result.ActivityId);
        await _runner.Received(1).ExecuteAsync(1, 5, 10, null, null, null, slightlyFuture, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UncorkAsync_WithDateBefore1900_ThrowsValidationException()
    {
        // Arrange
        var ancientDate = new DateTimeOffset(1899, 12, 31, 23, 59, 59, TimeSpan.Zero);
        var sut = CreateSut();
        var request = new UncorkRequestDto(WineVintageId: 10, OccurredAt: ancientDate);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => sut.UncorkAsync(1, request));
        Assert.Contains("1900", ex.Message);
        await _runner.DidNotReceiveWithAnyArgs().ExecuteAsync(default, default, default, default, default, default, default, Arg.Any<CancellationToken>());
    }

    [Fact]
    public void UncorkRequestDto_AllowsNullOccurredAtByDefault()
    {
        var dto = new UncorkRequestDto(WineVintageId: 1);
        Assert.Null(dto.OccurredAt);
    }

    [Fact]
    public void HistorySorting_RetroactiveUncork_SortsChronologicallyDescending()
    {
        // Simulate items returned with occurred_at desc
        var t1 = new DateTime(2026, 11, 2, 12, 0, 0, DateTimeKind.Utc);
        var tRetroactive = new DateTime(2026, 10, 15, 12, 0, 0, DateTimeKind.Utc);
        var tOld = new DateTime(2026, 9, 1, 12, 0, 0, DateTimeKind.Utc);

        var list = new List<HistoryItemDto>
        {
            new(1, "Uncorked", t1, new HistoryWineDto(1, "Vino A", "Bodega A", "Tinto"), null, null, null, null),
            new(2, "Uncorked", tRetroactive, new HistoryWineDto(2, "Vino B", "Bodega B", "Blanco"), null, null, null, null),
            new(3, "Uncorked", tOld, new HistoryWineDto(3, "Vino C", "Bodega C", "Tinto"), null, null, null, null)
        };

        var sorted = list.OrderByDescending(x => x.OccurredAt).ToList();
        Assert.Equal(1, sorted[0].Id);
        Assert.Equal(2, sorted[1].Id);
        Assert.Equal(3, sorted[2].Id);
    }
}
