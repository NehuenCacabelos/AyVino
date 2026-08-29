using AyVino.Api.Features.Ubicaciones.Models;

namespace AyVino.Api.Features.Ubicaciones.DTOs;

public static class UbicacionMappingExtensions
{
    public static Ubicacion ToEntity(this CreateUbicacionRequestDto dto)
    {
        return new Ubicacion
        {
            Pais = dto.Pais.Trim(),
            Provincia = dto.Provincia?.Trim(),
            Ciudad = dto.Ciudad?.Trim()
        };
    }

    public static UbicacionResponseDto ToResponseDto(this Ubicacion ubicacion)
    {
        return new UbicacionResponseDto(
            Id: ubicacion.Id,
            Pais: ubicacion.Pais,
            Provincia: ubicacion.Provincia,
            Ciudad: ubicacion.Ciudad
        );
    }

    public static IEnumerable<UbicacionResponseDto> ToResponseDtoList(this IEnumerable<Ubicacion> ubicaciones)
    {
        return ubicaciones.Select(u => u.ToResponseDto());
    }
}