namespace AyVino.Api.Features.Locations.Models;

public record Location
{
    public int Id { get; init; }
    public string Country { get; init; } = string.Empty;
    public string? State { get; init; }
    public string? City { get; init; }
}