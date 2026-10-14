using AyVino.Api.Features.Pairings.Enums;

namespace AyVino.Api.Features.Pairings.DTOs;

public record UpdatePairingRequestDto(
    string Name,
    PairingCategory Category
);