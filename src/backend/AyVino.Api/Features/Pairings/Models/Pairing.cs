using AyVino.Api.Features.Pairings.Enums;

namespace AyVino.Api.Features.Pairings.Models;

public record Pairing
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public PairingCategory Category { get; init; }
}