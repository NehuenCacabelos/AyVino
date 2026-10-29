namespace AyVino.Api.Features.Locations.Models;

public record State
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
}