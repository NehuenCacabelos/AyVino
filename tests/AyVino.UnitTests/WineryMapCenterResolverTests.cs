using AyVino.Api.Features.Locations.Services;
using AyVino.Api.Features.Wineries.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Xunit;

namespace AyVino.UnitTests;

public class WineryMapCenterResolverTests
{
    private readonly IGeorefClient _georefClient = Substitute.For<IGeorefClient>();
    private readonly IMemoryCache _memoryCache = new MemoryCache(new MemoryCacheOptions());
    private readonly WineryMapCenterResolver _resolver;

    public WineryMapCenterResolverTests()
    {
        _resolver = new WineryMapCenterResolver(
            _georefClient,
            _memoryCache,
            NullLogger<WineryMapCenterResolver>.Instance);
    }

    [Fact]
    public async Task ResolveMapCenter_WithExactCoordinates_ReturnsExactPrecisionWithoutCallingGeoref()
    {
        // Act
        var result = await _resolver.ResolveMapCenterAsync(
            latitude: -34.6037m,
            longitude: -58.3816m,
            departmentName: "Comuna 1",
            provinceName: "CABA");

        // Assert
        Assert.Equal("exact", result.Precision);
        Assert.Equal(-34.6037m, result.Latitude);
        Assert.Equal(-58.3816m, result.Longitude);
        await _georefClient.DidNotReceiveWithAnyArgs().GetDepartmentCentroidAsync(default, default, default);
        await _georefClient.DidNotReceiveWithAnyArgs().GetProvinceCentroidAsync(default, default);
    }

    [Fact]
    public async Task ResolveMapCenter_WithoutCoordinates_ResolvesLocalityCentroidViaGeoref()
    {
        // Arrange
        _georefClient.GetDepartmentCentroidAsync(null, "Sarmiento", "Chubut", Arg.Any<CancellationToken>())
            .Returns(new GeorefCoordinates(-45.345m, -69.002m));

        // Act
        var result = await _resolver.ResolveMapCenterAsync(
            latitude: null,
            longitude: null,
            departmentName: "Sarmiento",
            provinceName: "Chubut");

        // Assert
        Assert.Equal("locality", result.Precision);
        Assert.Equal(-45.345m, result.Latitude);
        Assert.Equal(-69.002m, result.Longitude);
    }

    [Fact]
    public async Task ResolveMapCenter_WhenDepartmentFails_FallsBackToProvinceCentroidViaGeoref()
    {
        // Arrange
        _georefClient.GetDepartmentCentroidAsync(null, "Paraje Inexistente", "Chubut", Arg.Any<CancellationToken>())
            .Returns((GeorefCoordinates?)null);
        _georefClient.GetProvinceCentroidAsync(null, "Chubut", Arg.Any<CancellationToken>())
            .Returns(new GeorefCoordinates(-43.7886m, -68.5264m));

        // Act
        var result = await _resolver.ResolveMapCenterAsync(
            latitude: null,
            longitude: null,
            departmentName: "Paraje Inexistente",
            provinceName: "Chubut");

        // Assert
        Assert.Equal("province", result.Precision);
        Assert.Equal(-43.7886m, result.Latitude);
        Assert.Equal(-68.5264m, result.Longitude);
    }

    [Fact]
    public async Task ResolveMapCenter_WhenGeorefEntirelyFails_FallsBackToStaticProvinceDictionary()
    {
        // Arrange
        _georefClient.GetDepartmentCentroidAsync(null, "Sarmiento", "Chubut", Arg.Any<CancellationToken>())
            .Returns((GeorefCoordinates?)null);
        _georefClient.GetProvinceCentroidAsync(null, "Chubut", Arg.Any<CancellationToken>())
            .Returns((GeorefCoordinates?)null);

        // Act
        var result = await _resolver.ResolveMapCenterAsync(
            latitude: null,
            longitude: null,
            departmentName: "Sarmiento",
            provinceName: "Chubut");

        // Assert
        Assert.Equal("province", result.Precision);
        Assert.Equal(-43.7886m, result.Latitude);
        Assert.Equal(-68.5264m, result.Longitude);
    }

    [Fact]
    public async Task ResolveMapCenter_WithoutAnyLocationData_ReturnsNonePrecisionWithArgentinaCenter()
    {
        // Act
        var result = await _resolver.ResolveMapCenterAsync(
            latitude: null,
            longitude: null,
            departmentName: null,
            provinceName: null);

        // Assert
        Assert.Equal("none", result.Precision);
        Assert.Equal(-38.4161m, result.Latitude);
        Assert.Equal(-63.6167m, result.Longitude);
    }

    [Fact]
    public async Task ResolveMapCenter_UsesCacheForSubsequentCalls()
    {
        // Arrange
        _georefClient.GetDepartmentCentroidAsync(null, "Luján de Cuyo", "Mendoza", Arg.Any<CancellationToken>())
            .Returns(new GeorefCoordinates(-33.05m, -68.88m));

        // Act - Call 1
        var result1 = await _resolver.ResolveMapCenterAsync(null, null, "Luján de Cuyo", "Mendoza");
        // Act - Call 2
        var result2 = await _resolver.ResolveMapCenterAsync(null, null, "Luján de Cuyo", "Mendoza");

        // Assert
        Assert.Equal("locality", result1.Precision);
        Assert.Equal("locality", result2.Precision);
        Assert.Equal(result1.Latitude, result2.Latitude);
        // Only 1 network call should have occurred
        await _georefClient.Received(1).GetDepartmentCentroidAsync(null, "Luján de Cuyo", "Mendoza", Arg.Any<CancellationToken>());
    }
}
