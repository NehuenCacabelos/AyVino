using AyVino.Api.Features.Grapes.Enums;

namespace AyVino.Api.Features.Grapes.Models;

public record Grape
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public ColorType ColorType { get; init; }
    public TypicalBody? TypicalBody { get; init; }
    public TypicalTannins? TypicalTannins { get; init; }
    public TypicalAcidity? TypicalAcidity { get; init; }
    public string? Description { get; init; }
}