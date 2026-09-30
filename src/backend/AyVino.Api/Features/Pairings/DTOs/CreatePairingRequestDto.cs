using AyVino.Api.Features.Pairings.Enums;

namespace AyVino.Api.Features.Pairings.DTOs;

public record CreatePairingRequestDto(
    string Name,
    PairingCategory Category
);