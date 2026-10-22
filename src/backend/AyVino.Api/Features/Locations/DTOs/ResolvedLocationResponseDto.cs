namespace AyVino.Api.Features.Locations.DTOs;

public record ResolvedLocationResponseDto(
    int LocationId,
    int StateId,
    string StateName,
    int RegionId,
    string RegionName,
    string? MunicipalityName);
