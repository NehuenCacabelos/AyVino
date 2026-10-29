namespace AyVino.Api.Features.Users.DTOs;

public record PublicUserProfileDto(
    int Id,
    string Username,
    string? Photo,
    string? Bio,
    DateTime RegisterDate,
    int CellarWinesCount,
    int FollowersCount,
    int FollowingCount
);

