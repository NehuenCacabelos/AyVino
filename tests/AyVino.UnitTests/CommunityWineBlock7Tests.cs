using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Audit.Services;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Cellars.Services;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.History.DTOs;
using AyVino.Api.Features.History.Enums;
using AyVino.Api.Features.History.Repositories;
using AyVino.Api.Features.History.Services;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Reviews.DTOs;
using AyVino.Api.Features.Reviews.Models;
using AyVino.Api.Features.Reviews.Repositories;
using AyVino.Api.Features.Reviews.Services;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace AyVino.UnitTests;

public class CommunityWineBlock7Tests
{
    private readonly IActivityRecorder _activityRecorder = Substitute.For<IActivityRecorder>();
    private readonly IHistoryRepository _historyRepo = Substitute.For<IHistoryRepository>();

    [Theory]
    [InlineData(0, 10)]
    [InlineData(-1, 10)]
    public async Task HistoryService_InvalidPageNumber_ThrowsValidationException(int pageNumber, int pageSize)
    {
        var service = new HistoryService(_historyRepo);
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.GetUserHistoryAsync(1, pageNumber, pageSize));
        Assert.Contains("pageNumber", ex.Message);
    }

    [Theory]
    [InlineData(1, 0)]
    [InlineData(1, -5)]
    [InlineData(1, 101)]
    public async Task HistoryService_InvalidPageSize_ThrowsValidationException(int pageNumber, int pageSize)
    {
        var service = new HistoryService(_historyRepo);
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.GetUserHistoryAsync(1, pageNumber, pageSize));
        Assert.Contains("pageSize", ex.Message);
    }

    [Fact]
    public async Task HistoryService_InvalidType_ThrowsValidationException()
    {
        var service = new HistoryService(_historyRepo);
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.GetUserHistoryAsync(1, 1, 20, "NonExistentType"));
        Assert.Contains("Tipo de actividad inválido", ex.Message);
    }

    [Fact]
    public async Task HistoryService_ValidType_ParsesAndCallsRepository()
    {
        var service = new HistoryService(_historyRepo);
        _historyRepo.GetUserHistoryAsync(1, 1, 20, ActivityType.Reviewed, Arg.Any<CancellationToken>())
            .Returns(new List<HistoryItemDto>());

        var result = await service.GetUserHistoryAsync(1, 1, 20, "Reviewed");

        Assert.NotNull(result);
        await _historyRepo.Received(1).GetUserHistoryAsync(1, 1, 20, ActivityType.Reviewed, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ReviewService_CreateAsync_RecordsReviewedActivity()
    {
        var reviewRepo = Substitute.For<IReviewRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var logger = Substitute.For<ILogger<ReviewService>>();

        vintageRepo.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);
        vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 5, ApprovalStatus = ApprovalStatus.Approved });
        reviewRepo.ExistsForUserAndVintageAsync(1, 10, Arg.Any<CancellationToken>()).Returns(false);
        reviewRepo.CreateAsync(Arg.Any<Review>(), Arg.Any<CancellationToken>()).Returns(100);
        reviewRepo.GetResponseByIdAsync(100, Arg.Any<CancellationToken>())
            .Returns(new ReviewResponseDto(100, 1, "testuser", 10, null, 5, "Great!", DateTime.UtcNow, null));

        var sut = new ReviewService(reviewRepo, vintageRepo, null, _activityRecorder, logger);

        var response = await sut.CreateAsync(new CreateReviewRequestDto(10, 5, "Great!"), 1);

        Assert.NotNull(response);
        await _activityRecorder.Received(1).RecordAsync(1, ActivityType.Reviewed, 5, 10, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ReviewService_CreateAsync_WhenRecorderFails_DoesNotBreakOperation()
    {
        var reviewRepo = Substitute.For<IReviewRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var logger = Substitute.For<ILogger<ReviewService>>();

        vintageRepo.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);
        vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 5, ApprovalStatus = ApprovalStatus.Approved });
        reviewRepo.ExistsForUserAndVintageAsync(1, 10, Arg.Any<CancellationToken>()).Returns(false);
        reviewRepo.CreateAsync(Arg.Any<Review>(), Arg.Any<CancellationToken>()).Returns(100);
        reviewRepo.GetResponseByIdAsync(100, Arg.Any<CancellationToken>())
            .Returns(new ReviewResponseDto(100, 1, "testuser", 10, null, 5, "Great!", DateTime.UtcNow, null));

        _activityRecorder.RecordAsync(Arg.Any<int>(), Arg.Any<ActivityType>(), Arg.Any<int>(), Arg.Any<int?>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(new Exception("Database connection failure"));

        var sut = new ReviewService(reviewRepo, vintageRepo, null, _activityRecorder, logger);

        var response = await sut.CreateAsync(new CreateReviewRequestDto(10, 5, "Great!"), 1);

        Assert.NotNull(response);
    }

    [Fact]
    public async Task ReviewService_UpdateAsync_DoesNotRecordActivity()
    {
        var reviewRepo = Substitute.For<IReviewRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var logger = Substitute.For<ILogger<ReviewService>>();

        reviewRepo.GetByIdAsync(100, Arg.Any<CancellationToken>())
            .Returns(new Review { Id = 100, UserId = 1, WineVintageId = 10, Rating = 4, Comment = "Original" });
        reviewRepo.UpdateAsync(Arg.Any<Review>(), Arg.Any<CancellationToken>()).Returns(true);
        reviewRepo.GetResponseByIdAsync(100, Arg.Any<CancellationToken>())
            .Returns(new ReviewResponseDto(100, 1, "testuser", 10, null, 5, "Updated", DateTime.UtcNow, DateTime.UtcNow));

        var sut = new ReviewService(reviewRepo, vintageRepo, null, _activityRecorder, logger);

        var response = await sut.UpdateAsync(100, new UpdateReviewRequestDto(5, "Updated"), 1);

        Assert.NotNull(response);
        await _activityRecorder.DidNotReceiveWithAnyArgs().RecordAsync(default, default, default, default, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CellarItemService_AddAsync_RecordsAddedToCellarActivity()
    {
        var cellarRepo = Substitute.For<ICellarRepository>();
        var itemRepo = Substitute.For<ICellarItemRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var logger = Substitute.For<ILogger<CellarItemService>>();

        cellarRepo.GetByIdAsync(1, 42, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = 1, UserId = 42, Name = "Mi Cava" });
        vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 7, ApprovalStatus = ApprovalStatus.Approved });
        itemRepo.GetAsync(1, 10, Arg.Any<CancellationToken>()).Returns((CellarItem?)null);
        itemRepo.GetRowAsync(1, 10, Arg.Any<CancellationToken>())
            .Returns(new CellarItemListRow { WineVintageId = 10, WineId = 7, Name = "Vino Test", WineType = WineType.Red, Quantity = 2 });

        var sut = new CellarItemService(cellarRepo, itemRepo, vintageRepo, _activityRecorder, logger);

        var result = await sut.AddAsync(42, 1, new AddCellarItemRequestDto(10, 2, null, null));

        Assert.NotNull(result);
        await _activityRecorder.Received(1).RecordAsync(42, ActivityType.AddedToCellar, 7, 10, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CellarItemService_AddAsync_WhenRecorderFails_DoesNotBreakOperation()
    {
        var cellarRepo = Substitute.For<ICellarRepository>();
        var itemRepo = Substitute.For<ICellarItemRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var logger = Substitute.For<ILogger<CellarItemService>>();

        cellarRepo.GetByIdAsync(1, 42, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = 1, UserId = 42, Name = "Mi Cava" });
        vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 10, WineId = 7, ApprovalStatus = ApprovalStatus.Approved });
        itemRepo.GetAsync(1, 10, Arg.Any<CancellationToken>()).Returns((CellarItem?)null);
        itemRepo.GetRowAsync(1, 10, Arg.Any<CancellationToken>())
            .Returns(new CellarItemListRow { WineVintageId = 10, WineId = 7, Name = "Vino Test", WineType = WineType.Red, Quantity = 2 });

        _activityRecorder.RecordAsync(Arg.Any<int>(), Arg.Any<ActivityType>(), Arg.Any<int>(), Arg.Any<int?>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(new Exception("Activity DB error"));

        var sut = new CellarItemService(cellarRepo, itemRepo, vintageRepo, _activityRecorder, logger);

        var result = await sut.AddAsync(42, 1, new AddCellarItemRequestDto(10, 2, null, null));

        Assert.NotNull(result);
    }

    [Fact]
    public async Task CellarItemService_UpdateAsync_DoesNotRecordActivity()
    {
        var cellarRepo = Substitute.For<ICellarRepository>();
        var itemRepo = Substitute.For<ICellarItemRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var logger = Substitute.For<ILogger<CellarItemService>>();

        cellarRepo.GetByIdAsync(1, 42, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = 1, UserId = 42, Name = "Mi Cava" });
        itemRepo.UpdateAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<int>(), Arg.Any<DateOnly?>(), Arg.Any<string?>(), Arg.Any<CancellationToken>()).Returns(true);
        itemRepo.GetRowAsync(1, 10, Arg.Any<CancellationToken>())
            .Returns(new CellarItemListRow { WineVintageId = 10, WineId = 7, Name = "Vino Test", WineType = WineType.Red, Quantity = 5 });

        var sut = new CellarItemService(cellarRepo, itemRepo, vintageRepo, _activityRecorder, logger);

        var result = await sut.UpdateAsync(42, 1, 10, new UpdateCellarItemRequestDto(5, null, null));

        Assert.NotNull(result);
        await _activityRecorder.DidNotReceiveWithAnyArgs().RecordAsync(default, default, default, default, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WineService_CreateAsync_RecordsWineContributedActivity()
    {
        var wineRepo = Substitute.For<IWineRepository>();
        var wineryRepo = Substitute.For<IWineryRepository>();
        var locationRepo = Substitute.For<ILocationRepository>();
        var grapeRepo = Substitute.For<IGrapeRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var logger = Substitute.For<ILogger<WineService>>();

        wineRepo.GetByLabelKeyAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns((Wine?)null);
        wineRepo.CreateWithFirstVintageAsync(Arg.Any<Wine>(), Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 88, Name = "Nuevo Vino", WineType = WineType.Red, WineryNameText = "Bodega Libre" });
        vintageRepo.GetAllByWineIdAsync(88, Arg.Any<CancellationToken>())
            .Returns(new List<WineVintage> { new() { Id = 999, WineId = 88, Year = 2022 } });

        var sut = new WineService(wineRepo, wineryRepo, locationRepo, grapeRepo, vintageRepo, _activityRecorder, logger);
        var actor = new Actor(15, AppRoles.User);

        var dto = new CreateWineRequestDto(
            Name: "Nuevo Vino",
            WineType: "Red",
            FirstVintage: new CreateWineVintageRequestDto(Year: 2022, AlcoholContent: 14.0m, Grapes: new List<WineGrapeRequestDto>()),
            WineryId: null,
            WineryNameText: "Bodega Libre",
            Description: null,
            LocationId: null);

        var result = await sut.CreateAsync(dto, actor);

        Assert.NotNull(result);
        await _activityRecorder.Received(1).RecordAsync(15, ActivityType.WineContributed, 88, 999, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WineVintageService_CreateAsync_RecordsWineContributedActivity()
    {
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var wineRepo = Substitute.For<IWineRepository>();
        var grapeRepo = Substitute.For<IGrapeRepository>();
        var wineryRepo = Substitute.For<IWineryRepository>();
        var logger = Substitute.For<ILogger<WineVintageService>>();

        wineRepo.GetByIdAsync(50, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 50, Name = "Vino 50", WineType = WineType.Red });
        vintageRepo.GetAllByWineIdAsync(50, Arg.Any<CancellationToken>())
            .Returns(new List<WineVintage>());
        vintageRepo.CreateAsync(Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 123, WineId = 50, Year = 2023 });

        var sut = new WineVintageService(
            vintageRepo, wineRepo, grapeRepo, wineryRepo,
            activityRecorder: _activityRecorder, logger: logger);

        var actor = new Actor(22, AppRoles.User);
        var dto = new CreateWineVintageRequestDto(Year: 2023, AlcoholContent: 13.5m, Grapes: new List<WineGrapeRequestDto>());

        var result = await sut.CreateAsync(50, dto, actor);

        Assert.NotNull(result);
        await _activityRecorder.Received(1).RecordAsync(22, ActivityType.WineContributed, 50, 123, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WineVintageService_CreateAsync_WhenRecorderFails_DoesNotBreakOperation()
    {
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var wineRepo = Substitute.For<IWineRepository>();
        var grapeRepo = Substitute.For<IGrapeRepository>();
        var wineryRepo = Substitute.For<IWineryRepository>();
        var logger = Substitute.For<ILogger<WineVintageService>>();

        wineRepo.GetByIdAsync(50, Arg.Any<CancellationToken>())
            .Returns(new Wine { Id = 50, Name = "Vino 50", WineType = WineType.Red });
        vintageRepo.GetAllByWineIdAsync(50, Arg.Any<CancellationToken>())
            .Returns(new List<WineVintage>());
        vintageRepo.CreateAsync(Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>())
            .Returns(new WineVintage { Id = 123, WineId = 50, Year = 2023 });

        _activityRecorder.RecordAsync(Arg.Any<int>(), Arg.Any<ActivityType>(), Arg.Any<int>(), Arg.Any<int?>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(new Exception("Recorder failed"));

        var sut = new WineVintageService(
            vintageRepo, wineRepo, grapeRepo, wineryRepo,
            activityRecorder: _activityRecorder, logger: logger);

        var actor = new Actor(22, AppRoles.User);
        var dto = new CreateWineVintageRequestDto(Year: 2023, AlcoholContent: 13.5m, Grapes: new List<WineGrapeRequestDto>());

        var result = await sut.CreateAsync(50, dto, actor);

        Assert.NotNull(result);
    }
}
