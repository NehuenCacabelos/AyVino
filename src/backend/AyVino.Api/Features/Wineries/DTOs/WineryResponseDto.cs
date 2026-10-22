namespace AyVino.Api.Features.Wineries.DTOs;

public record WineryLocationSummaryDto(string StateName, string RegionName);

public record WineryResponseDto(
    int Id,
    string Name,
    string? Description,
    int LocationId,
    int? FoundationYear,
    string? Website,
    int? UserId,
    string Status,
    DateTime RegisterDate,
    decimal? Latitude = null,
    decimal? Longitude = null,
    string? LogoUrl = null,
    WineryLocationSummaryDto? Location = null);
