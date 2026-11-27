using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
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

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.DeleteAsync(wineId: 10, vintageId: 100, new Actor(1, AppRoles.Admin)));
    }

    [Fact]
    public async Task DeleteAsync_VintageBelongsToAnotherWine_ThrowsNotFoundException()
    {
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 99 });
        var service = CreateService();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.DeleteAsync(wineId: 10, vintageId: 100, new Actor(1, AppRoles.Admin)));
    }

    [Fact]
    public async Task DeleteAsync_VintageWithReviews_ThrowsConflictException_SuggestingRechazar()
    {
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 10 });
        _vintageRepo.GetAllByWineIdAsync(10).Returns(new[]
        {
            new WineVintage { Id = 100, WineId = 10 },
            new WineVintage { Id = 101, WineId = 10 }
        });
        _vintageRepo.GetUsageCountsAsync(100).Returns(new WineVintageUsageCounts(ReviewCount: 2, CellarItemCount: 0));
        var service = CreateService();

        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            service.DeleteAsync(wineId: 10, vintageId: 100, new Actor(1, AppRoles.Admin)));
        Assert.Contains("historial de usuarios (reseñas: 2, cava: 0)", ex.Message);
        Assert.Contains("Podés rechazarla en lugar de eliminarla para preservar el historial.", ex.Message);
        await _vintageRepo.DidNotReceive().DeleteAsync(Arg.Any<int>());
    }

    [Fact]
    public async Task DeleteAsync_VintageWithCellarItems_ThrowsConflictException_SuggestingRechazar()
    {
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 10 });
        _vintageRepo.GetAllByWineIdAsync(10).Returns(new[]
        {
            new WineVintage { Id = 100, WineId = 10 },
            new WineVintage { Id = 101, WineId = 10 }
        });
        _vintageRepo.GetUsageCountsAsync(100).Returns(new WineVintageUsageCounts(ReviewCount: 0, CellarItemCount: 4));
        var service = CreateService();

        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            service.DeleteAsync(wineId: 10, vintageId: 100, new Actor(1, AppRoles.Admin)));
        Assert.Contains("historial de usuarios (reseñas: 0, cava: 4)", ex.Message);
        Assert.Contains("Podés rechazarla en lugar de eliminarla para preservar el historial.", ex.Message);
        await _vintageRepo.DidNotReceive().DeleteAsync(Arg.Any<int>());
    }

    [Fact]
    public async Task DeleteAsync_VintageWithoutHistory_CallsDeleteSuccessfully_ForAdmin()
    {
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 10 });
        _vintageRepo.GetAllByWineIdAsync(10).Returns(new[]
        {
            new WineVintage { Id = 100, WineId = 10 },
            new WineVintage { Id = 101, WineId = 10 }
        });
        _vintageRepo.GetUsageCountsAsync(100).Returns(new WineVintageUsageCounts(ReviewCount: 0, CellarItemCount: 0));
        _vintageRepo.DeleteAsync(100).Returns(true);
        var service = CreateService();

        await service.DeleteAsync(wineId: 10, vintageId: 100, new Actor(1, AppRoles.Admin));

        await _vintageRepo.Received(1).DeleteAsync(100);
    }

    [Fact]
    public async Task DeleteAsync_Owner_DeletesVintageSuccessfully()
    {
        var wine = new Wine { Id = 10, WineryId = 5 };
        var winery = new Winery { Id = 5, UserId = 123, Status = WineryStatus.Approved };
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 10 });
        _wineRepo.GetByIdAsync(10).Returns(wine);
        _wineryRepo.GetByIdAsync(5).Returns(winery);
        _vintageRepo.GetAllByWineIdAsync(10).Returns(new[]
        {
            new WineVintage { Id = 100, WineId = 10 },
            new WineVintage { Id = 101, WineId = 10 }
        });
        _vintageRepo.GetUsageCountsAsync(100).Returns(new WineVintageUsageCounts(ReviewCount: 0, CellarItemCount: 0));
        _vintageRepo.DeleteAsync(100).Returns(true);
        var service = CreateService();
        var ownerActor = new Actor(123, AppRoles.Winery);

        await service.DeleteAsync(wineId: 10, vintageId: 100, ownerActor);

        await _vintageRepo.Received(1).DeleteAsync(100);
    }

    [Fact]
    public async Task DeleteAsync_OtherWinery_ThrowsForbiddenException()
    {
        var wine = new Wine { Id = 10, WineryId = 5 };
        var winery = new Winery { Id = 5, UserId = 123, Status = WineryStatus.Approved };
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 10 });
        _wineRepo.GetByIdAsync(10).Returns(wine);
        _wineryRepo.GetByIdAsync(5).Returns(winery);
        var service = CreateService();
        var otherActor = new Actor(999, AppRoles.Winery);

        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.DeleteAsync(wineId: 10, vintageId: 100, otherActor));
        Assert.Equal("No tenés permiso para eliminar esta añada.", ex.Message);
        await _vintageRepo.DidNotReceive().DeleteAsync(Arg.Any<int>());
    }

    [Fact]
    public async Task DeleteAsync_CommunityWine_ByNonAdmin_ThrowsForbiddenException()
    {
        var wine = new Wine { Id = 10, WineryId = null };
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 10 });
        _wineRepo.GetByIdAsync(10).Returns(wine);
        var service = CreateService();
        var userActor = new Actor(5, AppRoles.User);

        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.DeleteAsync(wineId: 10, vintageId: 100, userActor));
        Assert.Equal("No tenés permiso para eliminar esta añada.", ex.Message);
        await _vintageRepo.DidNotReceive().DeleteAsync(Arg.Any<int>());
    }

    [Fact]
    public async Task DeleteAsync_OnlyVintage_ThrowsConflictException_ForOwner()
    {
        var wine = new Wine { Id = 10, WineryId = 5 };
        var winery = new Winery { Id = 5, UserId = 123, Status = WineryStatus.Approved };
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 10 });
        _wineRepo.GetByIdAsync(10).Returns(wine);
        _wineryRepo.GetByIdAsync(5).Returns(winery);
        _vintageRepo.GetAllByWineIdAsync(10).Returns(new[]
        {
            new WineVintage { Id = 100, WineId = 10 }
        });
        var service = CreateService();
        var ownerActor = new Actor(123, AppRoles.Winery);

        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            service.DeleteAsync(wineId: 10, vintageId: 100, ownerActor));
        Assert.Equal("No se puede eliminar la única añada del vino. Eliminá el vino completo.", ex.Message);
        await _vintageRepo.DidNotReceive().DeleteAsync(Arg.Any<int>());
    }

    [Fact]
    public async Task DeleteAsync_OnlyVintage_ThrowsConflictException_ForAdmin()
    {
        _vintageRepo.GetByIdAsync(100).Returns(new WineVintage { Id = 100, WineId = 10 });
        _vintageRepo.GetAllByWineIdAsync(10).Returns(new[]
        {
            new WineVintage { Id = 100, WineId = 10 }
        });
        var service = CreateService();
        var adminActor = new Actor(1, AppRoles.Admin);

        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            service.DeleteAsync(wineId: 10, vintageId: 100, adminActor));
        Assert.Equal("No se puede eliminar la única añada del vino. Eliminá el vino completo.", ex.Message);
        await _vintageRepo.DidNotReceive().DeleteAsync(Arg.Any<int>());
    }

    [Fact]
    public void WineVintageUsageCounts_Constructors_SupportDapperMaterialization()
    {
        // 1. Parameterless constructor
        var empty = new WineVintageUsageCounts();
        Assert.Equal(0, empty.ReviewCount);
        Assert.Equal(0, empty.CellarItemCount);
        Assert.False(empty.HasUserHistory);

        // 2. Long constructor (PostgreSQL COUNT(*) bigint signature)
        var fromLong = new WineVintageUsageCounts(reviewCount: 5L, cellarItemCount: 3L);
        Assert.Equal(5, fromLong.ReviewCount);
        Assert.Equal(3, fromLong.CellarItemCount);
        Assert.True(fromLong.HasUserHistory);

        // 3. Int primary constructor
        var fromInt = new WineVintageUsageCounts(ReviewCount: 2, CellarItemCount: 1);
        Assert.Equal(2, fromInt.ReviewCount);
        Assert.Equal(1, fromInt.CellarItemCount);
        Assert.True(fromInt.HasUserHistory);
    }

    [Fact]
    public void WineUsageCounts_Constructors_SupportDapperMaterialization()
    {
        // 1. Parameterless constructor
        var empty = new WineUsageCounts();
        Assert.Equal(0, empty.DuplicateWinesCount);
        Assert.Equal(0, empty.ReviewCount);
        Assert.Equal(0, empty.UserWineCount);
        Assert.Equal(0, empty.CellarItemCount);
        Assert.False(empty.HasBlockingUsage);

        // 2. Long constructor (PostgreSQL COUNT(*) bigint signature)
        var fromLong = new WineUsageCounts(duplicateWinesCount: 1L, reviewCount: 4L, userWineCount: 2L, cellarItemCount: 3L);
        Assert.Equal(1, fromLong.DuplicateWinesCount);
        Assert.Equal(4, fromLong.ReviewCount);
        Assert.Equal(2, fromLong.UserWineCount);
        Assert.Equal(3, fromLong.CellarItemCount);
        Assert.True(fromLong.HasBlockingUsage);

        // 3. Int primary constructor
        var fromInt = new WineUsageCounts(0, 0, 0, 0);
        Assert.False(fromInt.HasBlockingUsage);
    }
}
