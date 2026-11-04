namespace AyVino.Api.Features.Locations.Services;

public record GeorefCoordinates(decimal Latitude, decimal Longitude);

public record GeorefLocationResult(
    string ProvinceId,
    string ProvinceName,
    string DepartmentId,
    string DepartmentName,
    string? MunicipalityName);

public interface IGeorefClient
{
    Task<GeorefLocationResult> ResolveLocationAsync(decimal latitude, decimal longitude, CancellationToken ct = default);
    Task<GeorefCoordinates?> GetDepartmentCentroidAsync(string? departmentId, string? departmentName, string? provinceName, CancellationToken ct = default);
    Task<GeorefCoordinates?> GetProvinceCentroidAsync(string? provinceId, string? provinceName, CancellationToken ct = default);
}
