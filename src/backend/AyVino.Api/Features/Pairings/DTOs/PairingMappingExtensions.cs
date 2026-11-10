using AyVino.Api.Features.Pairings.Models;

namespace AyVino.Api.Features.Pairings.DTOs;

public static class PairingMappingExtensions
{
    public static Pairing ToEntity(this CreatePairingRequestDto dto)
    {
        return new Pairing
        {
            Name = dto.Name,
            Category = dto.Category
        };
    }

    public static PairingResponseDto ToResponseDto(this Pairing pairing)
    {
        return new PairingResponseDto(
            pairing.Id,
            pairing.Name,
            pairing.Category.ToString()
        );
    }

    public static IEnumerable<PairingResponseDto> ToResponseDtoList(this IEnumerable<Pairing> pairings)
    {
        return pairings.Select(p => p.ToResponseDto());
    }
}