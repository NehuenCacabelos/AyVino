using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Grapes.Models;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Locations.DTOs;
using AyVino.Api.Features.Locations.Models;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Wineries.DTOs;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Services;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;

namespace AyVino.UnitTests;

public class WineOptimizationTests
{
    [Fact]
    public async Task WineVintageService_GetAllByWineIdAsync_EliminatesNPlusOne_UsingBatchGrapeQuery()
    {
        // Arrange
        var fakeWineRepo = new FakeWineRepo { ExistingWineId = 1 };
        var fakeVintageRepo = new FakeVintageRepo
        {
            Vintages =
            [
                new WineVintage { Id = 101, WineId = 1, Year = 2020, ApprovalStatus = ApprovalStatus.Approved },
                new WineVintage { Id = 102, WineId = 1, Year = 2021, ApprovalStatus = ApprovalStatus.Approved }
            ],
            Grapes =
            [
                new WineGrape { WineVintageId = 101, GrapeId = 1, Percentage = 80 },
                new WineGrape { WineVintageId = 101, GrapeId = 2, Percentage = 20 },
                new WineGrape { WineVintageId = 102, GrapeId = 1, Percentage = 100 }
            ]
        };

        var service = new WineVintageService(fakeVintageRepo, fakeWineRepo, new FakeGrapeRepo());

        // Act
        var result = (await service.GetAllByWineIdAsync(1)).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal(1, fakeVintageRepo.BatchGrapesCallCount);
        Assert.Equal(0, fakeVintageRepo.SingleGrapeCallCount);

        var firstVintage = result.Single(v => v.Id == 101);
        Assert.Equal(2, firstVintage.Grapes.Count());

        var secondVintage = result.Single(v => v.Id == 102);
        Assert.Single(secondVintage.Grapes);
        Assert.Equal(1, secondVintage.Grapes.First().GrapeId);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("NotAStatus")]
    public async Task WineVintageService_ChangeStatusAsync_ThrowsValidationException_WhenStatusInvalid(string invalidStatus)
    {
        // Arrange
        var fakeWineRepo = new FakeWineRepo { ExistingWineId = 1 };
        var fakeVintageRepo = new FakeVintageRepo();
        var service = new WineVintageService(fakeVintageRepo, fakeWineRepo, new FakeGrapeRepo());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.ChangeStatusAsync(1, 101, new ChangeWineVintageStatusRequestDto(invalidStatus)));

        Assert.Contains("Invalid status", ex.Message);
    }

    [Fact]
    public async Task WineVintageService_ChangeStatusAsync_UpdatesStatus_WhenValid()
    {
        // Arrange
        var fakeWineRepo = new FakeWineRepo { ExistingWineId = 1 };
        var fakeVintageRepo = new FakeVintageRepo
        {
            Vintages = [new WineVintage { Id = 101, WineId = 1, Year = 2020, ApprovalStatus = ApprovalStatus.Pending }]
        };
        var service = new WineVintageService(fakeVintageRepo, fakeWineRepo, new FakeGrapeRepo());

        // Act
        var result = await service.ChangeStatusAsync(1, 101, new ChangeWineVintageStatusRequestDto("Approved"));

        // Assert
        Assert.NotNull(result);
        Assert.Equal(ApprovalStatus.Approved.ToString(), result.ApprovalStatus);
    }

    [Fact]
    public async Task WineService_ClaimWinesAsync_EliminatesNPlusOne_UsingBatchGetByIds()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepo
        {
            ExistingWinery = new Winery
            {
                Id = 10,
                Name = "Bodega Catena Zapata",
                LocationId = 1,
                Status = WineryStatus.Approved,
                RegisterDate = DateTime.UtcNow
            }
        };

        var fakeWineRepo = new FakeWineRepo
        {
            WinesById = new Dictionary<int, Wine>
            {
                [1] = new Wine { Id = 1, WineryId = 10, Name = "Vino 1", WineType = WineType.Red, SourceType = SourceType.Official },
                [2] = new Wine { Id = 2, WineryId = 10, Name = "Vino 2", WineType = WineType.Red, SourceType = SourceType.Official }
            }
        };

        var service = new WineService(fakeWineRepo, fakeWineryRepo, new FakeLocationRepo(), new FakeGrapeRepo());

        // Act
        var result = (await service.ClaimWinesAsync(10, [1, 2])).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal(1, fakeWineRepo.BatchGetByIdsCallCount);
        Assert.Equal(0, fakeWineRepo.SingleGetByIdCallCount);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("InvalidStatus")]
    public async Task WineryService_ChangeStatusAsync_ThrowsValidationException_WhenStatusInvalid(string invalidStatus)
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepo();
        var service = new WineryService(fakeWineryRepo, new FakeLocationRepo(), null!, null!);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.ChangeStatusAsync(1, new ChangeWineryStatusRequestDto(invalidStatus)));

        Assert.Contains("Invalid status", ex.Message);
    }

    [Fact]
    public async Task WineryService_ChangeStatusAsync_UpdatesStatus_WhenValid()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepo
        {
            ExistingWinery = new Winery
            {
                Id = 5,
                Name = "Bodega Zuccardi",
                LocationId = 1,
                Status = WineryStatus.Pending,
                RegisterDate = DateTime.UtcNow
            }
        };
        var service = new WineryService(fakeWineryRepo, new FakeLocationRepo(), null!, null!);

        // Act
        var result = await service.ChangeStatusAsync(5, new ChangeWineryStatusRequestDto("Approved"));

        // Assert
        Assert.NotNull(result);
        Assert.Equal(WineryStatus.Approved.ToString(), result.Status);
    }

    #region Fakes

    private sealed class FakeVintageRepo : IWineVintageRepository
    {
        public List<WineVintage> Vintages { get; set; } = [];
        public List<WineGrape> Grapes { get; set; } = [];
        public int SingleGrapeCallCount { get; private set; }
        public int BatchGrapesCallCount { get; private set; }

        public Task<WineVintage?> GetByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(Vintages.FirstOrDefault(v => v.Id == id));

        public Task<IEnumerable<WineVintage>> GetAllByWineIdAsync(int wineId, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<WineVintage>>(Vintages.Where(v => v.WineId == wineId).ToList());

        public Task<IEnumerable<WineGrape>> GetGrapesByVintageIdAsync(int vintageId, CancellationToken ct = default)
        {
            SingleGrapeCallCount++;
            return Task.FromResult<IEnumerable<WineGrape>>(Grapes.Where(g => g.WineVintageId == vintageId).ToList());
        }

        public Task<IEnumerable<WineGrape>> GetGrapesByVintageIdsAsync(IEnumerable<int> vintageIds, CancellationToken ct = default)
        {
            BatchGrapesCallCount++;
            var set = vintageIds.ToHashSet();
            return Task.FromResult<IEnumerable<WineGrape>>(Grapes.Where(g => set.Contains(g.WineVintageId)).ToList());
        }

        public Task<WineVintage> CreateAsync(WineVintage vintage, IEnumerable<WineGrape> grapes, CancellationToken ct = default) =>
            throw new NotImplementedException();

        public Task<bool> UpdateAsync(WineVintage vintage, IEnumerable<WineGrape> grapes, CancellationToken ct = default) =>
            throw new NotImplementedException();

        public Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default)
        {
            var idx = Vintages.FindIndex(v => v.Id == id);
            if (idx < 0) return Task.FromResult(false);
            Vintages[idx] = Vintages[idx] with { ApprovalStatus = (ApprovalStatus)status };
            return Task.FromResult(true);
        }

        public Task<bool> DeleteAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(true);

        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(Vintages.Any(v => v.Id == id));
    }

    private sealed class FakeWineRepo : IWineRepository
    {
        public int? ExistingWineId { get; set; }
        public Dictionary<int, Wine> WinesById { get; set; } = [];
        public int SingleGetByIdCallCount { get; private set; }
        public int BatchGetByIdsCallCount { get; private set; }

        public Task<Wine?> GetByIdAsync(int id, CancellationToken ct = default)
        {
            SingleGetByIdCallCount++;
            if (WinesById.TryGetValue(id, out var wine)) return Task.FromResult<Wine?>(wine);
            if (ExistingWineId == id) return Task.FromResult<Wine?>(new Wine { Id = id, Name = "Test Wine" });
            return Task.FromResult<Wine?>(null);
        }

        public Task<IEnumerable<Wine>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken ct = default)
        {
            BatchGetByIdsCallCount++;
            var list = ids.Where(id => WinesById.ContainsKey(id)).Select(id => WinesById[id]).ToList();
            return Task.FromResult<IEnumerable<Wine>>(list);
        }

        public Task<IEnumerable<Wine>> GetAllAsync(int pageNumber, int pageSize, int? wineryId = null, int? grapeId = null, int? yearFrom = null, int? yearTo = null, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<Wine>>([]);

        public Task<Wine> CreateWithFirstVintageAsync(Wine wine, WineVintage firstVintage, IEnumerable<WineGrape> grapes, CancellationToken ct = default) =>
            throw new NotImplementedException();

        public Task<bool> UpdateAsync(Wine wine, CancellationToken ct = default) =>
            Task.FromResult(true);

        public Task<bool> DeleteAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(true);

        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingWineId == id || WinesById.ContainsKey(id));

        public Task<IEnumerable<Wine>> GetUnclaimedByNameLikeAsync(string nameFragment, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<Wine>>([]);

        public Task<int> ClaimWinesAsync(int wineryId, IEnumerable<int> wineIds, CancellationToken ct = default) =>
            Task.FromResult(wineIds.Count());

        public Task<IEnumerable<Wine>> SearchAsync(string? name, string? winery, int? year, WineType? wineType, int pageNumber, int pageSize, CancellationToken ct = default) => Task.FromResult<IEnumerable<Wine>>([]);
    }

    private sealed class FakeWineryRepo : IWineryRepository
    {
        public Winery? ExistingWinery { get; set; }

        public Task<Winery?> GetByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingWinery?.Id == id ? ExistingWinery : null);

        public Task<IEnumerable<Winery>> GetAllAsync(int pageNumber, int pageSize, int? status = null, int? locationId = null, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<Winery>>([]);

        public Task<Winery> CreateAsync(Winery winery, CancellationToken ct = default) =>
            throw new NotImplementedException();

        public Task<bool> UpdateAsync(Winery winery, CancellationToken ct = default) =>
            Task.FromResult(true);

        public Task<bool> DeleteAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(true);

        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingWinery?.Id == id);

        public Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default)
        {
            if (ExistingWinery?.Id == id)
            {
                ExistingWinery = ExistingWinery with { Status = (WineryStatus)status };
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }
    }

    private sealed class FakeGrapeRepo : IGrapeRepository
    {
        public Task<Grape?> GetByIdAsync(int id, CancellationToken ct = default) => Task.FromResult<Grape?>(null);
        public Task<IEnumerable<Grape>> GetAllAsync(int pageNumber, int pageSize, int? colorType = null, CancellationToken ct = default) => Task.FromResult<IEnumerable<Grape>>([]);
        public Task<int> CreateAsync(Grape grape, CancellationToken ct = default) => Task.FromResult(1);
        public Task<bool> UpdateAsync(Grape grape, CancellationToken ct = default) => Task.FromResult(true);
        public Task<bool> DeleteAsync(int id, CancellationToken ct = default) => Task.FromResult(true);
        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) => Task.FromResult(true);
    }

    private sealed class FakeLocationRepo : ILocationRepository
    {
        public Task<Location?> GetByIdAsync(int id, CancellationToken ct = default) => Task.FromResult<Location?>(null);
        public Task<int> CreateAsync(Location location, CancellationToken ct = default) => Task.FromResult(1);
        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) => Task.FromResult(true);
        public Task<IEnumerable<Location>> GetAllAsync(int pageNumber, int pageSize, CancellationToken ct = default) => Task.FromResult<IEnumerable<Location>>([]);
    }

    #endregion
}

