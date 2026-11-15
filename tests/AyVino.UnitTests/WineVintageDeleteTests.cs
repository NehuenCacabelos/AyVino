using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class WineVintageDeleteTests
{
    private readonly IWineVintageRepository _vintageRepo = Substitute.For<IWineVintageRepository>();
    private readonly IWineRepository _wineRepo = Substitute.For<IWineRepository>();
    private readonly IWineryRepository _wineryRepo = Substitute.For<IWineryRepository>();
    private readonly IGrapeRepository _grapeRepo = Substitute.For<IGrapeRepository>();

    private WineVintageService CreateService() =>
        new(_vintageRepo, _wineRepo, _grapeRepo, _wineryRepo);

    [Fact]
    public async Task DeleteAsync_VintageNotFound_ThrowsNotFoundException()
    {
        _vintageRepo.GetByIdAsync(100).Returns((WineVintage?)null);
        var service = CreateService();

        await Assert.ThrowsAsync<NotFoundException>(() => service.DeleteAsync(wineId: 10, vintageId: 100));
    }

    [Fact]
    public async Task DeleteAsync_VintageBelongsToAnotherWine_ThrowsNotFoundException()
    {
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 99 });
        var service = CreateService();

        await Assert.ThrowsAsync<NotFoundException>(() => service.DeleteAsync(wineId: 10, vintageId: 100));
    }

    [Fact]
    public async Task DeleteAsync_VintageWithReviews_ThrowsConflictException_SuggestingRechazar()
    {
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 10 });
        _vintageRepo.GetUsageCountsAsync(100).Returns(new WineVintageUsageCounts(ReviewCount: 2, CellarItemCount: 0));
        var service = CreateService();

        var ex = await Assert.ThrowsAsync<ConflictException>(() => service.DeleteAsync(wineId: 10, vintageId: 100));
        Assert.Contains("historial de usuarios (reseñas: 2, cava: 0)", ex.Message);
        Assert.Contains("Podés rechazarla en lugar de eliminarla para preservar el historial.", ex.Message);
        await _vintageRepo.DidNotReceive().DeleteAsync(Arg.Any<int>());
    }

    [Fact]
    public async Task DeleteAsync_VintageWithCellarItems_ThrowsConflictException_SuggestingRechazar()
    {
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 10 });
        _vintageRepo.GetUsageCountsAsync(100).Returns(new WineVintageUsageCounts(ReviewCount: 0, CellarItemCount: 4));
        var service = CreateService();

        var ex = await Assert.ThrowsAsync<ConflictException>(() => service.DeleteAsync(wineId: 10, vintageId: 100));
        Assert.Contains("historial de usuarios (reseñas: 0, cava: 4)", ex.Message);
        Assert.Contains("Podés rechazarla en lugar de eliminarla para preservar el historial.", ex.Message);
        await _vintageRepo.DidNotReceive().DeleteAsync(Arg.Any<int>());
    }

    [Fact]
    public async Task DeleteAsync_VintageWithoutHistory_CallsDeleteSuccessfully()
    {
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 10 });
        _vintageRepo.GetUsageCountsAsync(100).Returns(new WineVintageUsageCounts(ReviewCount: 0, CellarItemCount: 0));
        _vintageRepo.DeleteAsync(100).Returns(true);
        var service = CreateService();

        await service.DeleteAsync(wineId: 10, vintageId: 100);

        await _vintageRepo.Received(1).DeleteAsync(100);
    }
}
