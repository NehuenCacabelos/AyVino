using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Common.Security.Jwt;
using AyVino.Api.Features.Locations.Models;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Locations.Services;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Models;
using AyVino.Api.Features.Users.Services;
using AyVino.Api.Features.Wineries.DTOs;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class WineryLocationTests
{
    private readonly IWineryRepository _wineryRepo = Substitute.For<IWineryRepository>();
    private readonly ILocationRepository _locationRepo = Substitute.For<ILocationRepository>();
    private readonly ICityRepository _cityRepo = Substitute.For<ICityRepository>();
    private readonly IGeorefClient _georefClient = Substitute.For<IGeorefClient>();
    private readonly IUserService _userService = Substitute.For<IUserService>();
    private readonly IJwtTokenGenerator _jwtGen = Substitute.For<IJwtTokenGenerator>();
    private readonly WineryService _service;

    public WineryLocationTests()
    {
        _service = new WineryService(
            _wineryRepo,
            _locationRepo,
            _cityRepo,
            _georefClient,
            _userService,
            _jwtGen);
    }

    [Fact]
    public async Task RegisterWineryAsync_BothCoordsAndLocationIdProvided_ThrowsValidationException()
    {
        // Arrange
        var dto = new RegisterWineryRequestDto(
            "user", "user@test.com", "Password123!", "Bodega Test",
            LocationId: 1, Description: null, FoundationYear: null, Website: null,
            Latitude: -32.8894m, Longitude: -68.8458m);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.RegisterWineryAsync(dto));
        Assert.Contains("pero no ambos", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task RegisterWineryAsync_NeitherCoordsNorLocationIdProvided_ThrowsValidationException()
    {
        // Arrange
        var dto = new RegisterWineryRequestDto(
            "user", "user@test.com", "Password123!", "Bodega Test",
            LocationId: null, Description: null, FoundationYear: null, Website: null,
            Latitude: null, Longitude: null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.RegisterWineryAsync(dto));
        Assert.Contains("ubicación es obligatoria", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task RegisterWineryAsync_OnlyLatitudeProvided_ThrowsValidationException()
    {
        // Arrange
        var dto = new RegisterWineryRequestDto(
            "user", "user@test.com", "Password123!", "Bodega Test",
            LocationId: null, Description: null, FoundationYear: null, Website: null,
            Latitude: -32.8894m, Longitude: null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.RegisterWineryAsync(dto));
        Assert.Contains("tanto latitud como longitud", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task RegisterWineryAsync_WithCoordinates_ResolvesLocationAndSavesCoordinates()
    {
        // Arrange
        var dto = new RegisterWineryRequestDto(
            "bodega_owner", "owner@test.com", "Password123!", "Bodega Catena",
            LocationId: null, Description: "Vinos de altura", FoundationYear: 1902, Website: "https://catena.com",
            Latitude: -32.8894m, Longitude: -68.8458m);

        _georefClient.ResolveLocationAsync(-32.8894m, -68.8458m, Arg.Any<CancellationToken>())
            .Returns(new GeorefLocationResult("50", "Mendoza", "50007", "Capital", "Mendoza"));

        var city = new City { Id = 10, Name = "Capital", StateId = 1, GeorefId = "50007" };
        _cityRepo.GetByGeorefIdAsync("50007", Arg.Any<CancellationToken>())
            .Returns(city);

        var location = new Location { Id = 42, CityId = 10, CityName = "Capital", StateId = 1, StateName = "Mendoza" };
        _locationRepo.GetByCityIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(location);

        var userResponse = new UserResponseDto(5, "bodega_owner", "owner@test.com", "Winery", DateTime.UtcNow, true, null, null);
        _userService.RegisterAsync(Arg.Any<CreateUserRequestDto>(), Arg.Any<CancellationToken>())
            .Returns(userResponse);

        _wineryRepo.CreateAsync(Arg.Any<Winery>(), Arg.Any<CancellationToken>())
            .Returns(call => (Winery)call[0] with { Id = 100 });

        _wineryRepo.GetByIdAsync(100, Arg.Any<CancellationToken>())
            .Returns(call => new Winery
            {
                Id = 100,
                Name = "Bodega Catena",
                LocationId = 42,
                Latitude = -32.8894m,
                Longitude = -68.8458m,
                StateName = "Mendoza",
                RegionName = "Capital",
                UserId = 5,
                Status = WineryStatus.Pending,
                RegisterDate = DateTime.UtcNow
            });

        _jwtGen.GenerateToken(Arg.Any<User>())
            .Returns(("mock.jwt.token", DateTime.UtcNow.AddHours(1)));

        // Act
        var result = await _service.RegisterWineryAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(100, result.Winery.Id);
        Assert.Equal(42, result.Winery.LocationId);
        Assert.Equal(-32.8894m, result.Winery.Latitude);
        Assert.Equal(-68.8458m, result.Winery.Longitude);
        Assert.NotNull(result.Winery.Location);
        Assert.Equal("Mendoza", result.Winery.Location.StateName);
        Assert.Equal("Capital", result.Winery.Location.RegionName);
    }

    [Fact]
    public async Task RegisterWineryAsync_WithLocationId_SavesWithoutCoordinates()
    {
        // Arrange
        var dto = new RegisterWineryRequestDto(
            "bodega_owner", "owner@test.com", "Password123!", "Bodega Zuccardi",
            LocationId: 30, Description: null, FoundationYear: null, Website: null,
            Latitude: null, Longitude: null);

        _locationRepo.ExistsByIdAsync(30, Arg.Any<CancellationToken>())
            .Returns(true);

        var userResponse = new UserResponseDto(6, "bodega_owner", "owner@test.com", "Winery", DateTime.UtcNow, true, null, null);
        _userService.RegisterAsync(Arg.Any<CreateUserRequestDto>(), Arg.Any<CancellationToken>())
            .Returns(userResponse);

        _wineryRepo.CreateAsync(Arg.Any<Winery>(), Arg.Any<CancellationToken>())
            .Returns(call => (Winery)call[0] with { Id = 101 });

        _wineryRepo.GetByIdAsync(101, Arg.Any<CancellationToken>())
            .Returns(new Winery
            {
                Id = 101,
                Name = "Bodega Zuccardi",
                LocationId = 30,
                Latitude = null,
                Longitude = null,
                UserId = 6,
                Status = WineryStatus.Pending,
                RegisterDate = DateTime.UtcNow
            });

        _jwtGen.GenerateToken(Arg.Any<User>())
            .Returns(("mock.jwt.token", DateTime.UtcNow.AddHours(1)));

        // Act
        var result = await _service.RegisterWineryAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(30, result.Winery.LocationId);
        Assert.Null(result.Winery.Latitude);
        Assert.Null(result.Winery.Longitude);
    }

    [Fact]
    public async Task UpdateAsync_NoLocationProvided_PreservesExistingLocationAndCoordinates()
    {
        // Arrange
        var existing = new Winery
        {
            Id = 1,
            Name = "Bodega Actual",
            LocationId = 15,
            Latitude = -33.1234m,
            Longitude = -68.5678m,
            UserId = 10,
            Status = WineryStatus.Approved,
            RegisterDate = DateTime.UtcNow
        };

        _wineryRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(existing);
        _wineryRepo.UpdateAsync(Arg.Any<Winery>(), Arg.Any<CancellationToken>()).Returns(true);

        var updateDto = new UpdateWineryRequestDto(
            "Bodega Actualizada",
            LocationId: null,
            Description: "Nueva desc",
            FoundationYear: 1950,
            Website: "https://actualizada.com",
            Latitude: null,
            Longitude: null);

        var actor = new Actor(10, AppRoles.Winery);

        // Act
        var result = await _service.UpdateAsync(1, updateDto, actor);

        // Assert
        await _wineryRepo.Received(1).UpdateAsync(
            Arg.Is<Winery>(w => w.LocationId == 15 && w.Latitude == -33.1234m && w.Longitude == -68.5678m),
            Arg.Any<CancellationToken>());
    }
}
