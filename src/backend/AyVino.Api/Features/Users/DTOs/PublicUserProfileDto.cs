using System.Text.Json.Serialization;
using AyVino.Api.Common.Extensions;

namespace AyVino.Api.Features.Users.DTOs;

public record PublicUserProfileDto(
    int Id,
    string Username,
    Guid? AvatarImageId,
    string? Bio,
    DateTime RegisterDate,
    int CellarWinesCount,
    int FollowersCount,
    int FollowingCount,
    [property: JsonConverter(typeof(NullableDecimalOnePlaceJsonConverter))] decimal? AverageRating = null
);
