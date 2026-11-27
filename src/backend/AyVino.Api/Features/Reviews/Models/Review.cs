namespace AyVino.Api.Features.Reviews.Models;

public record Review
{
    public int Id { get; init; }
    public int UserId { get; init; }
    public int WineVintageId { get; init; }
    public decimal Rating { get; init; }
    public string? Comment { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}