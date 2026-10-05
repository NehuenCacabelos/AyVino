namespace AyVino.Api.Features.Follows.Models;

public record FollowUserItem
{
    public int UserId { get; init; }
    public string Username { get; init; } = string.Empty;
    public DateTime FollowedAt { get; init; }
}