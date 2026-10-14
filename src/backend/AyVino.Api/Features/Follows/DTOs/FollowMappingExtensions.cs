using AyVino.Api.Features.Follows.Models;

namespace AyVino.Api.Features.Follows.DTOs;

public static class FollowMappingExtensions
{
    public static FollowUserResponseDto ToResponseDto(this FollowUserItem item) =>
        new(item.UserId, item.Username, item.FollowedAt);

    public static FollowWineryResponseDto ToResponseDto(this FollowWineryItem item) =>
        new(item.WineryId, item.Name, item.FollowedAt);

    public static IReadOnlyList<FollowUserResponseDto> ToResponseDtoList(this IEnumerable<FollowUserItem> items) =>
        items.Select(i => i.ToResponseDto()).ToList();

    public static IReadOnlyList<FollowWineryResponseDto> ToResponseDtoList(this IEnumerable<FollowWineryItem> items) =>
        items.Select(i => i.ToResponseDto()).ToList();
}