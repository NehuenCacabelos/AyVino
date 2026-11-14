using System.Text.Json.Serialization;
using AyVino.Api.Common.Extensions;

namespace AyVino.Api.Features.Users.DTOs;

public record UserResponseDto(
    int Id,
    string Username,
    string Email,
    string Role,
    DateTime RegisterDate,
    bool IsActive,
    Guid? AvatarImageId,
    string? Bio,
    [property: JsonConverter(typeof(NullableDecimalOnePlaceJsonConverter))] decimal? AverageRating = null)
{
    public UserResponseDto() : this(default, string.Empty, string.Empty, string.Empty, default, default, null, null, null) { }
}

