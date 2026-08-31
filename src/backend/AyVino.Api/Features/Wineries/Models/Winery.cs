using AyVino.Api.Features.Wineries.Enums;

namespace AyVino.Api.Features.Wineries.Models;

public record Winery
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int LocationId { get; init; }
    public int? FoundationYear { get; init; }
    public string? Website { get; init; }
    public int? UserId { get; init; }
    public WineryStatus Status { get; init; }
    public DateTime RegisterDate { get; init; }
}