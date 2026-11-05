using System.Net;
using System.Net.Http.Json;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Locations.Services;
using Microsoft.Extensions.Logging.Abstractions;

namespace AyVino.UnitTests;

public class GeorefClientTests
{
    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handlerFunc) : HttpMessageHandler
    {
        public int CallCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;
            return Task.FromResult(handlerFunc(request));
        }
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(40.7128, -74.0060)]
    [InlineData(-10, -60)]
    [InlineData(-60, -65)]
    [InlineData(-34, -50)]
    [InlineData(-34, -80)]
    public async Task ResolveLocationAsync_CoordinatesOutsideArgentina_ThrowsUnprocessableEntityException(decimal lat, decimal lon)
    {
        // Arrange
        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));
        var client = new HttpClient(handler) { BaseAddress = new Uri("https://apis.datos.gob.ar/georef/api/v2.0/") };
        var georefClient = new GeorefClient(client, NullLogger<GeorefClient>.Instance);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnprocessableEntityException>(() => georefClient.ResolveLocationAsync(lat, lon));
        Assert.Contains("fuera del territorio", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(0, handler.CallCount);
    }

    [Fact]
    public async Task ResolveLocationAsync_SuccessfulResponse_ReturnsResolvedResult()
    {
        // Arrange
        var jsonResponse = """
            {
              "parametros": { "lat": -32.8894, "lon": -68.8458 },
              "ubicacion": {
                "departamento": { "id": "50007", "nombre": "Capital" },
                "gobierno_local": { "id": "500007", "nombre": "Mendoza" },
                "lat": -32.8894,
                "lon": -68.8458,
                "provincia": { "id": "50", "nombre": "Mendoza" }
              }
            }
            """;

        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(jsonResponse, System.Text.Encoding.UTF8, "application/json")
        });

        var client = new HttpClient(handler) { BaseAddress = new Uri("https://apis.datos.gob.ar/georef/api/v2.0/") };
        var georefClient = new GeorefClient(client, NullLogger<GeorefClient>.Instance);

        // Act
        var result = await georefClient.ResolveLocationAsync(-32.8894m, -68.8458m);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("50", result.ProvinceId);
        Assert.Equal("Mendoza", result.ProvinceName);
        Assert.Equal("50007", result.DepartmentId);
        Assert.Equal("Capital", result.DepartmentName);
        Assert.Equal("Mendoza", result.MunicipalityName);
        Assert.Equal(1, handler.CallCount);
    }

    [Fact]
    public async Task ResolveLocationAsync_UnresolvedDepartment_ThrowsUnprocessableEntityException()
    {
        // Arrange
        var jsonResponse = """
            {
              "parametros": { "lat": -34.0, "lon": -58.0 },
              "ubicacion": {
                "departamento": { "id": null, "nombre": null },
                "lat": -34.0,
                "lon": -58.0,
                "provincia": { "id": null, "nombre": null }
              }
            }
            """;

        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(jsonResponse, System.Text.Encoding.UTF8, "application/json")
        });

        var client = new HttpClient(handler) { BaseAddress = new Uri("https://apis.datos.gob.ar/georef/api/v2.0/") };
        var georefClient = new GeorefClient(client, NullLogger<GeorefClient>.Instance);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnprocessableEntityException>(() => georefClient.ResolveLocationAsync(-34.0m, -58.0m));
        Assert.Contains("No fue posible resolver", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ResolveLocationAsync_HttpError_RetriesAndThrowsServiceUnavailableException()
    {
        // Arrange
        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.InternalServerError));
        var client = new HttpClient(handler) { BaseAddress = new Uri("https://apis.datos.gob.ar/georef/api/v2.0/") };
        var georefClient = new GeorefClient(client, NullLogger<GeorefClient>.Instance);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ServiceUnavailableException>(() => georefClient.ResolveLocationAsync(-32.8894m, -68.8458m));
        Assert.Contains("no se encuentra disponible", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(2, handler.CallCount); // Verified retry
    }
}

