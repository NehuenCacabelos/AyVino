namespace AyVino.Api.Features.Locations.Services;

public record GeorefLocationResult(
    string ProvinceId,
    string ProvinceName,
    string DepartmentId,
    string DepartmentName,
    string? MunicipalityName);

public interface IGeorefClient
{
    Task<GeorefLocationResult> ResolveLocationAsync(decimal latitude, decimal longitude, CancellationToken ct = default);
}
