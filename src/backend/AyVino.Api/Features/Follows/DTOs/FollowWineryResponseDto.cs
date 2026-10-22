namespace AyVino.Api.Features.Follows.DTOs;

public record FollowWineryResponseDto(int WineryId, string Name, DateTime FollowedAt);