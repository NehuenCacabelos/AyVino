namespace AyVino.Api.Features.Follows.DTOs;

public record FollowUserResponseDto(int UserId, string Username, DateTime FollowedAt);