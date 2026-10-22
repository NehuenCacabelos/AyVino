using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using AyVino.Api.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace AyVino.Api.Features.Locations.Services;

public class GeorefClient(HttpClient httpClient, ILogger<GeorefClient> logger) : IGeorefClient
{
    private const decimal MinLatitude = -56.0m;
    private const decimal MaxLatitude = -21.0m;
    private const decimal MinLongitude = -74.0m;
    private const decimal MaxLongitude = -53.0m;

    public async Task<GeorefLocationResult> ResolveLocationAsync(decimal latitude, decimal longitude, CancellationToken ct = default)
    {
        // Pre-validación de coordenadas dentro del rectángulo razonable de Argentina
        if (latitude < MinLatitude || latitude > MaxLatitude || longitude < MinLongitude || longitude > MaxLongitude)
        {
            throw new UnprocessableEntityException("Las coordenadas provistas se encuentran fuera del territorio de la República Argentina.");
        }

        var latStr = latitude.ToString(CultureInfo.InvariantCulture);
        var lonStr = longitude.ToString(CultureInfo.InvariantCulture);
        var url = $"ubicacion?lat={latStr}&lon={lonStr}";

        GeorefResponse? response = null;
        Exception? lastException = null;

        for (var attempt = 1; attempt <= 2; attempt++)
        {
            try
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                cts.CancelAfter(TimeSpan.FromSeconds(4));

                var httpResponse = await httpClient.GetAsync(url, cts.Token);
                if (!httpResponse.IsSuccessStatusCode)
                {
                    logger.LogWarning("Respuesta no exitosa de Georef ({StatusCode}) en intento {Attempt}", httpResponse.StatusCode, attempt);
                    if (attempt == 2)
                    {
                        throw new ServiceUnavailableException("El servicio oficial Georef no se encuentra disponible. Por favor, reintente más tarde o utilice el selector manual de respaldo.");
                    }
                    await Task.Delay(250, ct);
                    continue;
                }

                response = await httpResponse.Content.ReadFromJsonAsync<GeorefResponse>(cts.Token);
                break;
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                lastException = ex;
                logger.LogWarning(ex, "Fallo al comunicar con Georef en intento {Attempt}", attempt);
                if (attempt == 1 && !ct.IsCancellationRequested)
                {
                    await Task.Delay(250, ct);
                }
            }
        }

        if (response is null)
        {
            logger.LogError(lastException, "Georef no respondió tras reintentos.");
            throw new ServiceUnavailableException("El servicio oficial Georef no se encuentra disponible. Por favor, reintente más tarde o utilice el selector manual de respaldo.");
        }

        var ubicacion = response.Ubicacion;
        var dept = ubicacion?.Departamento;
        var prov = ubicacion?.Provincia;

        if (string.IsNullOrWhiteSpace(dept?.Id) || string.IsNullOrWhiteSpace(dept.Nombre) ||
            string.IsNullOrWhiteSpace(prov?.Id) || string.IsNullOrWhiteSpace(prov.Nombre))
        {
            throw new UnprocessableEntityException("No fue posible resolver un departamento oficial argentino para las coordenadas provistas.");
        }

        var muniName = !string.IsNullOrWhiteSpace(ubicacion?.Municipio?.Nombre)
            ? ubicacion.Municipio.Nombre
            : ubicacion?.GobiernoLocal?.Nombre;

        return new GeorefLocationResult(
            ProvinceId: prov.Id,
            ProvinceName: prov.Nombre,
            DepartmentId: dept.Id,
            DepartmentName: dept.Nombre,
            MunicipalityName: muniName);
    }

    private sealed record GeorefResponse(
        [property: JsonPropertyName("ubicacion")] GeorefUbicacion? Ubicacion);

    private sealed record GeorefUbicacion(
        [property: JsonPropertyName("provincia")] GeorefNamedItem? Provincia,
        [property: JsonPropertyName("departamento")] GeorefNamedItem? Departamento,
        [property: JsonPropertyName("municipio")] GeorefNamedItem? Municipio,
        [property: JsonPropertyName("gobierno_local")] GeorefNamedItem? GobiernoLocal);

    private sealed record GeorefNamedItem(
        [property: JsonPropertyName("id")] string? Id,
        [property: JsonPropertyName("nombre")] string? Nombre);
}

