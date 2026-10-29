namespace AyVino.Api.Features.Pairings.Models;

public record WinePairing
{
    public int WineId { get; init; }
    public int PairingId { get; init; }
}