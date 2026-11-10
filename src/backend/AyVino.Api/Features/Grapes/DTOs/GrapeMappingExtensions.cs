using AyVino.Api.Features.Grapes.Models;

namespace AyVino.Api.Features.Grapes.DTOs;

public static class GrapeMappingExtensions
{
    public static Grape ToEntity(this CreateGrapeRequestDto dto)
    {
        return new Grape
        {
            Name = dto.Name,
            ColorType = dto.ColorType,
            TypicalBody = dto.TypicalBody,
            TypicalTannins = dto.TypicalTannins,
            TypicalAcidity = dto.TypicalAcidity,
            Description = dto.Description
        };
    }

    public static GrapeResponseDto ToResponseDto(this Grape grape)
    {
        return new GrapeResponseDto(
            grape.Id,
            grape.Name,
            grape.ColorType.ToString(),
            grape.TypicalBody?.ToString(),
            grape.TypicalTannins?.ToString(),
            grape.TypicalAcidity?.ToString(),
            grape.Description
        );
    }

    public static IEnumerable<GrapeResponseDto> ToResponseDtoList(this IEnumerable<Grape> grapes)
    {
        return grapes.Select(g => g.ToResponseDto());
    }
}