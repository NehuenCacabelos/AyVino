using System.Globalization;
using System.Text;
using AyVino.Api.Features.Locations.Services;
using AyVino.Api.Features.Wineries.DTOs;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace AyVino.Api.Features.Wineries.Services;

public class WineryMapCenterResolver(
    IGeorefClient georefClient,
    IMemoryCache memoryCache,
    ILogger<WineryMapCenterResolver> logger) : IWineryMapCenterResolver
{
    private static readonly decimal ArgentinaDefaultLat = -38.4161m;
    private static readonly decimal ArgentinaDefaultLon = -63.6167m;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(24);

    // Centros geográficos estáticos de las 23 provincias argentinas + CABA
    private static readonly Dictionary<string, (decimal Latitude, decimal Longitude)> StaticProvinceCentroids =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["mendoza"] = (-34.6297m, -68.5833m),
            ["san juan"] = (-30.8654m, -68.8895m),
            ["salta"] = (-24.7859m, -65.4117m),
            ["la rioja"] = (-29.4131m, -66.8558m),
            ["catamarca"] = (-28.4696m, -65.7852m),
            ["neuquen"] = (-38.9516m, -68.0591m),
            ["rio negro"] = (-39.0333m, -67.5833m),
            ["chubut"] = (-43.7886m, -68.5264m),
            ["buenos aires"] = (-36.6769m, -60.5588m),
            ["cordoba"] = (-31.4201m, -64.1888m),
            ["entre rios"] = (-32.0589m, -59.2014m),
            ["santa fe"] = (-30.7069m, -60.9499m),
            ["tucuman"] = (-26.9478m, -65.3648m),
            ["jujuy"] = (-23.3199m, -65.7644m),
            ["san luis"] = (-33.7577m, -66.0276m),
            ["la pampa"] = (-36.6167m, -64.2833m),
            ["corrientes"] = (-28.7743m, -57.7818m),
            ["misiones"] = (-26.8754m, -54.3001m),
            ["chaco"] = (-26.3864m, -60.7658m),
            ["formosa"] = (-24.8950m, -59.9324m),
            ["santiago del estero"] = (-27.7824m, -64.2642m),
            ["santa cruz"] = (-48.8715m, -69.9558m),
            ["tierra del fuego"] = (-54.3413m, -67.7426m),
            ["ciudad autonoma de buenos aires"] = (-34.6037m, -58.3816m),
            ["caba"] = (-34.6037m, -58.3816m),
        };

    public async Task<WineryMapCenterDto> ResolveMapCenterAsync(
        decimal? latitude,
        decimal? longitude,
        string? departmentName,
        string? provinceName,
        string? departmentGeorefId = null,
        CancellationToken ct = default)
    {
        // 1. Coordenadas exactas propias de la bodega
        if (latitude.HasValue && longitude.HasValue)
        {
            return new WineryMapCenterDto(latitude.Value, longitude.Value, "exact");
        }

        // Si no hay datos territoriales disponibles, fallback inmediato a país completo
        if (string.IsNullOrWhiteSpace(departmentName) &&
            string.IsNullOrWhiteSpace(provinceName) &&
            string.IsNullOrWhiteSpace(departmentGeorefId))
        {
            return new WineryMapCenterDto(ArgentinaDefaultLat, ArgentinaDefaultLon, "none");
        }

        // 2. Intentar resolver centroide de localidad / departamento
        if (!string.IsNullOrWhiteSpace(departmentGeorefId) || !string.IsNullOrWhiteSpace(departmentName))
        {
            var deptKey = $"mapcenter_dept_{departmentGeorefId?.Trim()}_{departmentName?.Trim()}_{provinceName?.Trim()}";
            if (memoryCache.TryGetValue(deptKey, out WineryMapCenterDto? cachedDept) && cachedDept != null)
            {
                return cachedDept;
            }

            try
            {
                var deptCoords = await georefClient.GetDepartmentCentroidAsync(
                    departmentGeorefId, departmentName, provinceName, ct);

                if (deptCoords != null)
                {
                    var result = new WineryMapCenterDto(deptCoords.Latitude, deptCoords.Longitude, "locality");
                    memoryCache.Set(deptKey, result, CacheDuration);
                    return result;
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Fallo al resolver centroide de departamento en Georef. Intentando fallback.");
            }
        }

        // 3. Fallback a centroide de provincia (Georef o diccionario estático)
        if (!string.IsNullOrWhiteSpace(provinceName))
        {
            var provKey = $"mapcenter_prov_{provinceName.Trim()}";
            if (memoryCache.TryGetValue(provKey, out WineryMapCenterDto? cachedProv) && cachedProv != null)
            {
                return cachedProv;
            }

            try
            {
                var provCoords = await georefClient.GetProvinceCentroidAsync(null, provinceName, ct);
                if (provCoords != null)
                {
                    var result = new WineryMapCenterDto(provCoords.Latitude, provCoords.Longitude, "province");
                    memoryCache.Set(provKey, result, CacheDuration);
                    return result;
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Fallo al resolver centroide de provincia en Georef para {Province}. Usando diccionario estático.", provinceName);
            }

            // Fallback estático de provincia
            var normalizedProv = NormalizeString(provinceName);
            if (StaticProvinceCentroids.TryGetValue(normalizedProv, out var staticCoords))
            {
                var result = new WineryMapCenterDto(staticCoords.Latitude, staticCoords.Longitude, "province");
                memoryCache.Set(provKey, result, CacheDuration);
                return result;
            }
        }

        // 4. Fallback final nacional
        return new WineryMapCenterDto(ArgentinaDefaultLat, ArgentinaDefaultLon, "none");
    }

    private static string NormalizeString(string text)
    {
        var normalized = text.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var ch in normalized)
        {
            var uc = CharUnicodeInfo.GetUnicodeCategory(ch);
            if (uc != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(ch);
            }
        }
        return sb.ToString().Normalize(NormalizationForm.FormC).Trim().ToLowerInvariant();
    }
}
