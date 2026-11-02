namespace AyVino.Api.Features.Follows.DTOs;

public record FollowWineryResponseDto(
    int WineryId,
    string Name,
    DateTime FollowedAt,
    Guid? LogoImageId = null,
    string? StateName = null,
    string? RegionName = null,
    int LabelsCount = 0,
    int FollowersCount = 0);
