using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Locations.Models;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Locations.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class LocationServiceResolveTests
{
    private readonly ILocationRepository _locationRepo = Substitute.For<ILocationRepository>();
    private readonly ICityRepository _cityRepo = Substitute.For<ICityRepository>();
    private readonly IGeorefClient _georefClient = Substitute.For<IGeorefClient>();
    private readonly LocationService _service;

    public LocationServiceResolveTests()
    {
        _service = new LocationService(_locationRepo, _cityRepo, _georefClient);
    }

    [Fact]
    public async Task ResolveCoordinatesAsync_ValidCoordinates_ReturnsResolvedDto()
    {
        // Arrange
        var georefResult = new GeorefLocationResult("50", "Mendoza", "50007", "Capital", "Mendoza");
        _georefClient.ResolveLocationAsync(-32.8894m, -68.8458m, Arg.Any<CancellationToken>())
            .Returns(georefResult);

        var city = new City { Id = 10, Name = "Capital", StateId = 1, GeorefId = "50007" };
        _cityRepo.GetByGeorefIdAsync("50007", Arg.Any<CancellationToken>())
            .Returns(city);

        var location = new Location
        {
            Id = 55,
            CityId = 10,
            CityName = "Capital",
            StateId = 1,
            StateName = "Mendoza"
        };
        _locationRepo.GetByCityIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(location);

        // Act
        var result = await _service.ResolveCoordinatesAsync(-32.8894m, -68.8458m);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(55, result.LocationId);
        Assert.Equal(1, result.StateId);
        Assert.Equal("Mendoza", result.StateName);
        Assert.Equal(10, result.RegionId);
        Assert.Equal("Capital", result.RegionName);
        Assert.Equal("Mendoza", result.MunicipalityName);
    }

    [Fact]
    public async Task ResolveCoordinatesAsync_CityNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var georefResult = new GeorefLocationResult("50", "Mendoza", "99999", "Inexistente", null);
        _georefClient.ResolveLocationAsync(-32.8894m, -68.8458m, Arg.Any<CancellationToken>())
            .Returns(georefResult);

        _cityRepo.GetByGeorefIdAsync("99999", Arg.Any<CancellationToken>())
            .Returns((City?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() => _service.ResolveCoordinatesAsync(-32.8894m, -68.8458m));
        Assert.Contains("No se encontró la región interna", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ResolveCoordinatesAsync_LocationNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var georefResult = new GeorefLocationResult("50", "Mendoza", "50007", "Capital", null);
        _georefClient.ResolveLocationAsync(-32.8894m, -68.8458m, Arg.Any<CancellationToken>())
            .Returns(georefResult);

        var city = new City { Id = 10, Name = "Capital", StateId = 1, GeorefId = "50007" };
        _cityRepo.GetByGeorefIdAsync("50007", Arg.Any<CancellationToken>())
            .Returns(city);

        _locationRepo.GetByCityIdAsync(10, Arg.Any<CancellationToken>())
            .Returns((Location?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() => _service.ResolveCoordinatesAsync(-32.8894m, -68.8458m));
        Assert.Contains("No se encontró el registro de ubicación", ex.Message, StringComparison.OrdinalIgnoreCase);
    }
}

