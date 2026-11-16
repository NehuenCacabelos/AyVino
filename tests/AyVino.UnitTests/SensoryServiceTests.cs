using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Sensory.DTOs;
using AyVino.Api.Features.Sensory.Models;
using AyVino.Api.Features.Sensory.Repositories;
using AyVino.Api.Features.Sensory.Services;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using NSubstitute;
using Xunit;

namespace AyVino.UnitTests;

public class SensoryServiceTests
{
    private readonly ISensoryRepository _sensoryRepo = Substitute.For<ISensoryRepository>();
    private readonly IWineVintageRepository _vintageRepo = Substitute.For<IWineVintageRepository>();
    private readonly IWineRepository _wineRepo = Substitute.For<IWineRepository>();
    private readonly IWineryRepository _wineryRepo = Substitute.For<IWineryRepository>();
    private readonly SensoryService _service;

    public SensoryServiceTests()
    {
        _service = new SensoryService(_sensoryRepo, _vintageRepo, _wineRepo, _wineryRepo);
    }

    private static WineVintage CreateVintage(int id, int wineId, int uploaderId, ApprovalStatus status = ApprovalStatus.Approved) => new()
    {
        Id = id,
        WineId = wineId,
        Year = 2021,
        AlcoholContent = 14m,
        ServingTemperature = 16,
        ApprovalStatus = status,
        UploadedByUserId = uploaderId,
        RegisterDate = DateTime.UtcNow
    };

    private static Wine CreateWine(int id, int? wineryId) => new()
    {
        Id = id,
        WineryId = wineryId,
        Name = "Gran Reserva",
        WineType = WineType.Red,
        SourceType = wineryId.HasValue ? SourceType.Official : SourceType.Community
    };

    private static Winery CreateWinery(int id, int ownerUserId, WineryStatus status = WineryStatus.Approved) => new()
    {
        Id = id,
        Name = "Bodega Los Andes",
        UserId = ownerUserId,
        Status = status
    };

    [Fact]
    public async Task GetSensory_AxisPriority_WineryTakesPrecedenceOverCalculated()
    {
        const int wineId = 10;
        const int vintageId = 20;
        var vintage = CreateVintage(vintageId, wineId, 1);
        var wine = CreateWine(wineId, 100);
        var winery = CreateWinery(100, 50);

        _vintageRepo.GetByIdAsync(vintageId, Arg.Any<CancellationToken>()).Returns(vintage);
        _wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);
        _wineryRepo.GetByIdAsync(100, Arg.Any<CancellationToken>()).Returns(winery);

        // Uva Malbec en la cosecha -> cálculo dará 4.0 / 4.0 / 3.0
        _sensoryRepo.GetVintageGrapesWithTypicalValuesAsync(vintageId, Arg.Any<CancellationToken>())
            .Returns([new GrapeWithSensoryRow(1, 100m, 40, 40, 30)]);

        // Valores manuales de la bodega: Body = 4.5, Tannins = null, Acidity = null, Fruit = 4.2
        _sensoryRepo.GetByVintageIdAsync(vintageId, Arg.Any<CancellationToken>())
            .Returns(new WineVintageSensory
            {
                WineVintageId = vintageId,
                Body = 4.5m,
                Tannins = null,
                Acidity = null,
                Fruit = 4.2m
            });

        var result = await _service.GetSensoryByVintageIdAsync(wineId, vintageId);

        Assert.Equal(6, result.Axes.Count);

        // Body: Manual 4.5, Calc 4.0 -> Source: Winery, Value: 4.5, CalculatedValue: 4.0
        var bodyAxis = result.Axes.First(a => a.Key == "body");
        Assert.Equal(4.5m, bodyAxis.Value);
        Assert.Equal("Winery", bodyAxis.Source);
        Assert.Equal(4.0m, bodyAxis.CalculatedValue);

        // Tannins: Manual null, Calc 4.0 -> Source: Calculated, Value: 4.0, CalculatedValue: 4.0
        var tanninsAxis = result.Axes.First(a => a.Key == "tannins");
        Assert.Equal(4.0m, tanninsAxis.Value);
        Assert.Equal("Calculated", tanninsAxis.Source);
        Assert.Equal(4.0m, tanninsAxis.CalculatedValue);

        // Fruit: Manual 4.2, Calc null -> Source: Winery, Value: 4.2, CalculatedValue: null
        var fruitAxis = result.Axes.First(a => a.Key == "fruit");
        Assert.Equal(4.2m, fruitAxis.Value);
        Assert.Equal("Winery", fruitAxis.Source);
        Assert.Null(fruitAxis.CalculatedValue);

        // Oak: Manual null, Calc null -> Source: None, Value: null, CalculatedValue: null
        var oakAxis = result.Axes.First(a => a.Key == "oak");
        Assert.Null(oakAxis.Value);
        Assert.Equal("None", oakAxis.Source);
        Assert.Null(oakAxis.CalculatedValue);
    }

    [Fact]
    public async Task GetSensory_PendingVintage_HiddenFromOtherUsers()
    {
        const int wineId = 10;
        const int vintageId = 20;
        var vintage = CreateVintage(vintageId, wineId, uploaderId: 2, status: ApprovalStatus.Pending);
        var wine = CreateWine(wineId, null);

        _vintageRepo.GetByIdAsync(vintageId, Arg.Any<CancellationToken>()).Returns(vintage);
        _wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);

        var randomActor = new Actor(99, AppRoles.User);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.GetSensoryByVintageIdAsync(wineId, vintageId, randomActor));
    }

    [Fact]
    public async Task UpdateSensory_WineryOwner_Succeeds()
    {
        const int wineId = 10;
        const int vintageId = 20;
        const int ownerUserId = 42;
        var vintage = CreateVintage(vintageId, wineId, 1);
        var wine = CreateWine(wineId, 100);
        var winery = CreateWinery(100, ownerUserId);

        _vintageRepo.GetByIdAsync(vintageId, Arg.Any<CancellationToken>()).Returns(vintage);
        _wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);
        _wineryRepo.GetByIdAsync(100, Arg.Any<CancellationToken>()).Returns(winery);

        var actor = new Actor(ownerUserId, AppRoles.Winery);
        var request = new UpdateVintageSensoryRequestDto(4.2m, 3.8m, 3.5m, 4.0m, 3.0m, 4.5m);

        var result = await _service.UpdateSensoryAsync(wineId, vintageId, request, actor);

        await _sensoryRepo.Received(1).UpsertAsync(Arg.Is<WineVintageSensory>(s =>
            s.WineVintageId == vintageId &&
            s.Body == 4.2m &&
            s.Tannins == 3.8m &&
            s.Acidity == 3.5m &&
            s.Fruit == 4.0m &&
            s.Oak == 3.0m &&
            s.Persistence == 4.5m), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateSensory_Admin_Succeeds()
    {
        const int wineId = 10;
        const int vintageId = 20;
        var vintage = CreateVintage(vintageId, wineId, 1);
        var wine = CreateWine(wineId, null);

        _vintageRepo.GetByIdAsync(vintageId, Arg.Any<CancellationToken>()).Returns(vintage);
        _wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);

        var adminActor = new Actor(1, AppRoles.Admin);
        var request = new UpdateVintageSensoryRequestDto(3.0m, null, null, null, null, null);

        await _service.UpdateSensoryAsync(wineId, vintageId, request, adminActor);

        await _sensoryRepo.Received(1).UpsertAsync(Arg.Is<WineVintageSensory>(s =>
            s.WineVintageId == vintageId && s.Body == 3.0m), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateSensory_OtherUser_ThrowsForbidden()
    {
        const int wineId = 10;
        const int vintageId = 20;
        var vintage = CreateVintage(vintageId, wineId, 1);
        var wine = CreateWine(wineId, 100);
        var winery = CreateWinery(100, ownerUserId: 50);

        _vintageRepo.GetByIdAsync(vintageId, Arg.Any<CancellationToken>()).Returns(vintage);
        _wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);
        _wineryRepo.GetByIdAsync(100, Arg.Any<CancellationToken>()).Returns(winery);

        var otherActor = new Actor(99, AppRoles.User);
        var request = new UpdateVintageSensoryRequestDto(4.0m, null, null, null, null, null);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.UpdateSensoryAsync(wineId, vintageId, request, otherActor));
    }

    [Fact]
    public async Task UpdateSensory_VintageBelongsToDifferentWine_ThrowsNotFound()
    {
        const int wineId = 10;
        const int vintageId = 20;
        var vintage = CreateVintage(vintageId, wineId: 99, uploaderId: 1);

        _vintageRepo.GetByIdAsync(vintageId, Arg.Any<CancellationToken>()).Returns(vintage);

        var adminActor = new Actor(1, AppRoles.Admin);
        var request = new UpdateVintageSensoryRequestDto(4.0m, null, null, null, null, null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.UpdateSensoryAsync(wineId, vintageId, request, adminActor));
    }

    [Theory]
    [InlineData(0.9)]
    [InlineData(5.1)]
    public async Task UpdateSensory_ValueOutOfRange_ThrowsValidationException(decimal invalidValue)
    {
        const int wineId = 10;
        const int vintageId = 20;
        var vintage = CreateVintage(vintageId, wineId, 1);
        var wine = CreateWine(wineId, null);

        _vintageRepo.GetByIdAsync(vintageId, Arg.Any<CancellationToken>()).Returns(vintage);
        _wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);

        var adminActor = new Actor(1, AppRoles.Admin);
        var request = new UpdateVintageSensoryRequestDto(invalidValue, null, null, null, null, null);

        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.UpdateSensoryAsync(wineId, vintageId, request, adminActor));
    }

    [Fact]
    public async Task UpdateSensory_ValueWithMoreThanOneDecimal_ThrowsValidationException()
    {
        const int wineId = 10;
        const int vintageId = 20;
        var vintage = CreateVintage(vintageId, wineId, 1);
        var wine = CreateWine(wineId, null);

        _vintageRepo.GetByIdAsync(vintageId, Arg.Any<CancellationToken>()).Returns(vintage);
        _wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);

        var adminActor = new Actor(1, AppRoles.Admin);
        var request = new UpdateVintageSensoryRequestDto(3.55m, null, null, null, null, null);

        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.UpdateSensoryAsync(wineId, vintageId, request, adminActor));
    }

    [Fact]
    public async Task UpdateSensory_AllValuesNull_DeletesRow()
    {
        const int wineId = 10;
        const int vintageId = 20;
        var vintage = CreateVintage(vintageId, wineId, 1);
        var wine = CreateWine(wineId, null);

        _vintageRepo.GetByIdAsync(vintageId, Arg.Any<CancellationToken>()).Returns(vintage);
        _wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);

        var adminActor = new Actor(1, AppRoles.Admin);
        var request = new UpdateVintageSensoryRequestDto(null, null, null, null, null, null);

        await _service.UpdateSensoryAsync(wineId, vintageId, request, adminActor);

        await _sensoryRepo.Received(1).DeleteAsync(vintageId, Arg.Any<CancellationToken>());
        await _sensoryRepo.DidNotReceive().UpsertAsync(Arg.Any<WineVintageSensory>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task PreviewSensory_MoreThan20Grapes_ThrowsValidationException()
    {
        var grapes = Enumerable.Range(1, 21).Select(i => new SensoryPreviewGrapeDto(i, 4m)).ToList();
        var request = new SensoryPreviewRequestDto(grapes);

        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.PreviewSensoryAsync(request));
    }

    [Fact]
    public async Task PreviewSensory_NonExistentGrape_ThrowsValidationException()
    {
        var request = new SensoryPreviewRequestDto([new SensoryPreviewGrapeDto(999, 100m)]);

        _sensoryRepo.GetGrapeTypicalValuesByIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<int, GrapeSensoryValuesRow>());

        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.PreviewSensoryAsync(request));
    }

    [Fact]
    public async Task PreviewSensory_ValidGrapes_ReturnsCalculatedAxesWithoutWinery()
    {
        var request = new SensoryPreviewRequestDto([new SensoryPreviewGrapeDto(1, 100m)]);

        _sensoryRepo.GetGrapeTypicalValuesByIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<int, GrapeSensoryValuesRow>
            {
                [1] = new(1, 40, 40, 30)
            });

        var result = await _service.PreviewSensoryAsync(request);

        Assert.Equal(6, result.Axes.Count);
        Assert.All(result.Axes, axis => Assert.NotEqual("Winery", axis.Source));

        var bodyAxis = result.Axes.First(a => a.Key == "body");
        Assert.Equal(4.0m, bodyAxis.Value);
        Assert.Equal("Calculated", bodyAxis.Source);
        Assert.Equal(4.0m, bodyAxis.CalculatedValue);

        var fruitAxis = result.Axes.First(a => a.Key == "fruit");
        Assert.Null(fruitAxis.Value);
        Assert.Equal("None", fruitAxis.Source);
        Assert.Null(fruitAxis.CalculatedValue);
    }
}
