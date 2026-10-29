using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Locations.DTOs;
using AyVino.Api.Features.Locations.Models;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Locations.Services;

namespace AyVino.UnitTests;

public class LocationServiceTests
{
    [Fact]
    public async Task GetByIdAsync_LocationExists_ReturnsResponseDtoMappedFromEntity()
    {
        // Arrange
        var fakeLocationRepo = new FakeLocationRepository
        {
            ExistingLocation = new Location
            {
                Id = 1,
                CityId = 10,
                CityName = "Luján de Cuyo",
                StateId = 1,
                StateName = "Mendoza"
            }
        };
        var service = new LocationService(fakeLocationRepo, new FakeCityRepository());

        // Act
        var result = await service.GetByIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal(10, result.CityId);
        Assert.Equal("Luján de Cuyo", result.CityName);
        Assert.Equal(1, result.StateId);
        Assert.Equal("Mendoza", result.StateName);
    }

    [Fact]
    public async Task GetByIdAsync_LocationNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var fakeLocationRepo = new FakeLocationRepository { ExistingLocation = null };
        var service = new LocationService(fakeLocationRepo, new FakeCityRepository());

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.GetByIdAsync(999));
    }

    [Fact]
    public async Task CreateAsync_ValidCity_MapsDtoToEntityAndReturnsResponseDto()
    {
        // Arrange
        var fakeLocationRepo = new FakeLocationRepository();
        var fakeCityRepo = new FakeCityRepository { ExistingCityId = 10 };
        var service = new LocationService(fakeLocationRepo, fakeCityRepo);

        var dto = new CreateLocationRequestDto(CityId: 10);

        // Act
        var result = await service.CreateAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.CityId);
        Assert.NotNull(fakeLocationRepo.CapturedCreatedLocation);
        Assert.Equal(10, fakeLocationRepo.CapturedCreatedLocation.CityId);
    }

    [Fact]
    public async Task CreateAsync_CityDoesNotExist_ThrowsNotFoundException()
    {
        // Arrange
        var fakeLocationRepo = new FakeLocationRepository();
        var fakeCityRepo = new FakeCityRepository { ExistingCityId = null };
        var service = new LocationService(fakeLocationRepo, fakeCityRepo);

        var dto = new CreateLocationRequestDto(CityId: 999);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.CreateAsync(dto));
    }

    [Fact]
    public async Task GetAllAsync_ReturnsMappedResponseDtos()
    {
        // Arrange
        var fakeLocationRepo = new FakeLocationRepository
        {
            Locations =
            [
                new Location { Id = 1, CityId = 10, CityName = "Luján de Cuyo", StateId = 1, StateName = "Mendoza" },
                new Location { Id = 2, CityId = 11, CityName = "Cafayate", StateId = 2, StateName = "Salta" }
            ]
        };
        var service = new LocationService(fakeLocationRepo, new FakeCityRepository());

        // Act
        var result = (await service.GetAllAsync(1, 10)).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal("Luján de Cuyo", result[0].CityName);
        Assert.Equal("Cafayate", result[1].CityName);
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(-1, 10)]
    [InlineData(1, 0)]
    [InlineData(1, 101)]
    public async Task GetAllAsync_InvalidPagination_ThrowsValidationException(int pageNumber, int pageSize)
    {
        // Arrange
        var service = new LocationService(new FakeLocationRepository(), new FakeCityRepository());

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => service.GetAllAsync(pageNumber, pageSize));
    }

    #region Fakes

    private sealed class FakeLocationRepository : ILocationRepository
    {
        public Location? ExistingLocation { get; set; }
        public Location? CapturedCreatedLocation { get; private set; }
        public List<Location> Locations { get; set; } = [];

        public Task<Location?> GetByIdAsync(int id, CancellationToken ct = default)
        {
            if (ExistingLocation?.Id == id) return Task.FromResult<Location?>(ExistingLocation);
            return Task.FromResult(Locations.FirstOrDefault(l => l.Id == id));
        }

        public Task<int> CreateAsync(Location location, CancellationToken ct = default)
        {
            CapturedCreatedLocation = location;
            var created = location with { Id = 77, CityName = "MockCity", StateId = 1, StateName = "MockState" };
            ExistingLocation = created;
            return Task.FromResult(77);
        }

        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingLocation?.Id == id || Locations.Any(l => l.Id == id));

        public Task<IEnumerable<Location>> GetAllAsync(int pageNumber, int pageSize, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<Location>>(Locations);
    }

    private sealed class FakeCityRepository : ICityRepository
    {
        public int? ExistingCityId { get; set; }

        public Task<City?> GetByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult<City?>(null);

        public Task<City?> GetByNameAndStateAsync(string name, int stateId, CancellationToken ct = default) =>
            Task.FromResult<City?>(null);

        public Task<IEnumerable<City>> GetAllAsync(int pageNumber, int pageSize, int? stateId, int? status, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<City>>([]);

        public Task<int> CreateAsync(City city, CancellationToken ct = default) =>
            Task.FromResult(1);

        public Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default) =>
            Task.FromResult(true);

        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingCityId == id);
    }

    #endregion
}

