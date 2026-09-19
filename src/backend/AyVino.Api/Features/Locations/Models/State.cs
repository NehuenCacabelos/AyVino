namespace AyVino.Api.Features.States.Models;

public record State
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
}