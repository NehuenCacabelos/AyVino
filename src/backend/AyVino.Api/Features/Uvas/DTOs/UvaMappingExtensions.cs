using AyVino.Api.Features.Uvas.Models;

namespace AyVino.Api.Features.Uvas.DTOs;

public static class UvaMappingExtensions
{
    public static Uva ToEntity(this CreateUvaRequestDto dto)
    {
        return new Uva
        {
            Nombre = dto.Nombre,
            TipoColor = dto.TipoColor,
            CuerpoTipico = dto.CuerpoTipico,
            TaninosTipico = dto.TaninosTipico,
            AcidezTipica = dto.AcidezTipica,
            Descripcion = dto.Descripcion
        };
    }

    public static UvaResponseDto ToResponseDto(this Uva uva)
    {
        return new UvaResponseDto(
            uva.Id,
            uva.Nombre,
            uva.TipoColor.ToString(),
            uva.CuerpoTipico?.ToString(),
            uva.TaninosTipico?.ToString(),
            uva.AcidezTipica?.ToString(),
            uva.Descripcion
        );
    }

    public static IEnumerable<UvaResponseDto> ToResponseDtoList(this IEnumerable<Uva> uvas)
    {
        return uvas.Select(u => u.ToResponseDto());
    }
}