using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Grapes.Models;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Locations.Models;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;

namespace AyVino.UnitTests;

public class WineServiceTests
{
    [Fact]
    public async Task CreateAsync_ValidRequest_MapsToDomainEntitiesAndInvokesRepository()
    {
        // Arrange
        var fakeWineRepo = new FakeWineRepository();
        var fakeWineryRepo = new FakeWineryRepository { ExistingWineryId = 10 };
        var fakeLocationRepo = new FakeLocationRepository { ExistingLocationId = 1 };
        var fakeGrapeRepo = new FakeGrapeRepository { ExistingGrapeId = 5 };

        var service = new WineService(fakeWineRepo, fakeWineryRepo, fakeLocationRepo, fakeGrapeRepo);

        var vintageDto = new CreateWineVintageRequestDto(
            Year: 2021,
            AlcoholContent: 14.2m,
            ServingTemperature: 16,
            AgingAdvice: "Beber antes de 2028",
            ImageUrl: "https://example.com/vintage.jpg",
            UploadedByUserId: 1,
            Grapes: [new WineGrapeRequestDto(GrapeId: 5, Percentage: 100)]
        );

        var wineDto = new CreateWineRequestDto(
            WineryId: 10,
            WineryNameText: null,
            Name: "Gran Reserva Malbec",
            Description: "Corte selecto de altura",
            WineType: "Red",
            LocationId: 1,
            FirstVintage: vintageDto
        );

        // Act
        var result = await service.CreateAsync(wineDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Gran Reserva Malbec", result.Name);
        Assert.Equal(SourceType.Official.ToString(), result.SourceType);

        Assert.NotNull(fakeWineRepo.CapturedCreatedWine);
        Assert.Equal("Gran Reserva Malbec", fakeWineRepo.CapturedCreatedWine.Name);
        Assert.Equal(WineType.Red, fakeWineRepo.CapturedCreatedWine.WineType);
        Assert.Equal(SourceType.Official, fakeWineRepo.CapturedCreatedWine.SourceType);

        Assert.NotNull(fakeWineRepo.CapturedFirstVintage);
        Assert.Equal(2021, fakeWineRepo.CapturedFirstVintage.Year);
        Assert.Equal(14.2m, fakeWineRepo.CapturedFirstVintage.AlcoholContent);

        Assert.NotNull(fakeWineRepo.CapturedGrapes);
        Assert.Single(fakeWineRepo.CapturedGrapes);
        Assert.Equal(5, fakeWineRepo.CapturedGrapes[0].GrapeId);
        Assert.Equal(100, fakeWineRepo.CapturedGrapes[0].Percentage);
    }

    [Fact]
    public async Task CreateAsync_WineryDoesNotExist_ThrowsValidationException()
    {
        // Arrange
        var fakeWineRepo = new FakeWineRepository();
        var fakeWineryRepo = new FakeWineryRepository { ExistingWineryId = null };
        var service = new WineService(fakeWineRepo, fakeWineryRepo, new FakeLocationRepository(), new FakeGrapeRepository());

        var wineDto = new CreateWineRequestDto(
            WineryId: 999,
            WineryNameText: null,
            Name: "Test Wine",
            Description: null,
            WineType: "Red",
            LocationId: null,
            FirstVintage: new CreateWineVintageRequestDto(UploadedByUserId: 1, Year: 2020)
        );

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(wineDto));
        Assert.Contains("Winery with ID 999 does not exist", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_LocationDoesNotExist_ThrowsValidationException()
    {
        // Arrange
        var fakeWineRepo = new FakeWineRepository();
        var fakeWineryRepo = new FakeWineryRepository { ExistingWineryId = 1 };
        var fakeLocationRepo = new FakeLocationRepository { ExistingLocationId = null };
        var service = new WineService(fakeWineRepo, fakeWineryRepo, fakeLocationRepo, new FakeGrapeRepository());

        var wineDto = new CreateWineRequestDto(
            WineryId: 1,
            WineryNameText: null,
            Name: "Test Wine",
            Description: null,
            WineType: "Red",
            LocationId: 999,
            FirstVintage: new CreateWineVintageRequestDto(UploadedByUserId: 1, Year: 2020)
        );

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(wineDto));
        Assert.Contains("Location with ID 999 does not exist", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_InvalidWineType_ThrowsValidationException()
    {
        // Arrange
        var fakeWineRepo = new FakeWineRepository();
        var service = new WineService(fakeWineRepo, new FakeWineryRepository(), new FakeLocationRepository(), new FakeGrapeRepository());

        var wineDto = new CreateWineRequestDto(
            WineryId: null,
            WineryNameText: "Comunidad",
            Name: "Vino Raro",
            Description: null,
            WineType: "BeerType",
            LocationId: null,
            FirstVintage: new CreateWineVintageRequestDto(UploadedByUserId: 1, Year: 2020)
        );

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(wineDto));
        Assert.Contains("Invalid wine type", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_WineExists_MapsToEntityAndReturnsUpdatedResponseDto()
    {
        // Arrange
        var fakeWineRepo = new FakeWineRepository
        {
            ExistingWine = new Wine
            {
                Id = 1,
                Name = "Original Name",
                WineType = WineType.Red,
                SourceType = SourceType.Official
            }
        };
        var service = new WineService(fakeWineRepo, new FakeWineryRepository(), new FakeLocationRepository(), new FakeGrapeRepository());

        var updateDto = new UpdateWineRequestDto(
            WineryId: null,
            WineryNameText: "Comunidad",
            Name: "Updated Wine Name",
            Description: "New notes",
            WineType: "White",
            LocationId: null
        );

        // Act
        var result = await service.UpdateAsync(1, updateDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Wine Name", result.Name);
        Assert.NotNull(fakeWineRepo.CapturedUpdatedWine);
        Assert.Equal(1, fakeWineRepo.CapturedUpdatedWine.Id);
        Assert.Equal(WineType.White, fakeWineRepo.CapturedUpdatedWine.WineType);
    }

    [Fact]
    public async Task UpdateAsync_WineNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var fakeWineRepo = new FakeWineRepository { ExistingWine = null };
        var service = new WineService(fakeWineRepo, new FakeWineryRepository(), new FakeLocationRepository(), new FakeGrapeRepository());

        var updateDto = new UpdateWineRequestDto(Name: "Any", WineType: "Red");

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.UpdateAsync(999, updateDto));
    }

    [Fact]
    public async Task GetByIdAsync_WineExists_ReturnsResponseDto()
    {
        // Arrange
        var fakeWineRepo = new FakeWineRepository
        {
            ExistingWine = new Wine { Id = 7, Name = "Rutini Cabernet", WineType = WineType.Red }
        };
        var service = new WineService(fakeWineRepo, new FakeWineryRepository(), new FakeLocationRepository(), new FakeGrapeRepository());

        // Act
        var result = await service.GetByIdAsync(7);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(7, result.Id);
        Assert.Equal("Rutini Cabernet", result.Name);
    }

    [Fact]
    public async Task GetByIdAsync_WineNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var fakeWineRepo = new FakeWineRepository { ExistingWine = null };
        var service = new WineService(fakeWineRepo, new FakeWineryRepository(), new FakeLocationRepository(), new FakeGrapeRepository());

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.GetByIdAsync(999));
    }

    #region Fakes

    private sealed class FakeWineRepository : IWineRepository
    {
        public Wine? ExistingWine { get; set; }
        public Wine? CapturedCreatedWine { get; private set; }
        public WineVintage? CapturedFirstVintage { get; private set; }
        public List<WineGrape>? CapturedGrapes { get; private set; }
        public Wine? CapturedUpdatedWine { get; private set; }

        public Task<Wine?> GetByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingWine?.Id == id ? ExistingWine : null);

        public Task<IEnumerable<Wine>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<Wine>>(ExistingWine is not null && ids.Contains(ExistingWine.Id) ? [ExistingWine] : []);

        public Task<IEnumerable<Wine>> GetAllAsync(int pageNumber, int pageSize, int? wineryId = null, int? grapeId = null, int? yearFrom = null, int? yearTo = null, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<Wine>>([]);

        public Task<Wine> CreateWithFirstVintageAsync(Wine wine, WineVintage firstVintage, IEnumerable<WineGrape> grapes, CancellationToken ct = default)
        {
            CapturedCreatedWine = wine;
            CapturedFirstVintage = firstVintage;
            CapturedGrapes = grapes.ToList();
            var created = wine with { Id = 100 };
            ExistingWine = created;
            return Task.FromResult(created);
        }

        public Task<bool> UpdateAsync(Wine wine, CancellationToken ct = default)
        {
            CapturedUpdatedWine = wine;
            if (ExistingWine?.Id == wine.Id)
            {
                ExistingWine = wine;
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }

        public Task<bool> DeleteAsync(int id, CancellationToken ct = default)
        {
            if (ExistingWine?.Id == id)
            {
                ExistingWine = null;
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }

        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingWine?.Id == id);

        public Task<IEnumerable<Wine>> GetUnclaimedByNameLikeAsync(string nameFragment, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<Wine>>([]);

        public Task<int> ClaimWinesAsync(int wineryId, IEnumerable<int> wineIds, CancellationToken ct = default) =>
            Task.FromResult(wineIds.Count());

        public Task<IEnumerable<Wine>> SearchAsync(string? name, string? winery, int? year, WineType? wineType, int pageNumber, int pageSize, CancellationToken ct = default) => Task.FromResult<IEnumerable<Wine>>([]);
    }

    private sealed class FakeWineryRepository : IWineryRepository
    {
        public int? ExistingWineryId { get; set; }

        public Task<Winery?> GetByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult<Winery?>(null);

        public Task<IEnumerable<Winery>> GetAllAsync(int pageNumber, int pageSize, int? status = null, int? locationId = null, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<Winery>>([]);

        public Task<Winery> CreateAsync(Winery winery, CancellationToken ct = default) =>
            throw new NotImplementedException();

        public Task<bool> UpdateAsync(Winery winery, CancellationToken ct = default) =>
            Task.FromResult(true);

        public Task<bool> DeleteAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(true);

        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingWineryId == id);

        public Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default) =>
            Task.FromResult(true);
    }

    private sealed class FakeLocationRepository : ILocationRepository
    {
        public int? ExistingLocationId { get; set; }

        public Task<Location?> GetByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult<Location?>(null);

        public Task<int> CreateAsync(Location location, CancellationToken ct = default) =>
            Task.FromResult(1);

        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingLocationId == id);

        public Task<IEnumerable<Location>> GetAllAsync(int pageNumber, int pageSize, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<Location>>([]);
    }

    private sealed class FakeGrapeRepository : IGrapeRepository
    {
        public int? ExistingGrapeId { get; set; }

        public Task<Grape?> GetByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult<Grape?>(null);

        public Task<IEnumerable<Grape>> GetAllAsync(int pageNumber, int pageSize, int? colorType = null, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<Grape>>([]);

        public Task<int> CreateAsync(Grape grape, CancellationToken ct = default) =>
            Task.FromResult(1);

        public Task<bool> UpdateAsync(Grape grape, CancellationToken ct = default) =>
            Task.FromResult(true);

        public Task<bool> DeleteAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(true);

        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingGrapeId == id);
    }

    #endregion
}
