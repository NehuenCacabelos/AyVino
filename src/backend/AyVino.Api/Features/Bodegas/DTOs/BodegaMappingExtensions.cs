using AyVino.Api.Features.Bodegas.Enums;
using AyVino.Api.Features.Bodegas.Models;

namespace AyVino.Api.Features.Bodegas.DTOs;

public static class BodegaMappingExtensions
{
    public static Bodega ToEntity(this CreateBodegaRequestDto dto, int? usuarioId) => new()
    {
        Nombre = dto.Nombre,
        Descripcion = dto.Descripcion,
        UbicacionId = dto.UbicacionId,
        AnioFundacion = dto.AnioFundacion,
        SitioWeb = dto.SitioWeb,
        UsuarioId = usuarioId,
        Estado = EstadoBodega.Pendiente,
        FechaRegistro = DateTime.UtcNow
    };

    public static BodegaResponseDto ToResponseDto(this Bodega bodega) => new(
        bodega.Id,
        bodega.Nombre,
        bodega.Descripcion,
        bodega.UbicacionId,
        bodega.AnioFundacion,
        bodega.SitioWeb,
        bodega.UsuarioId,
        bodega.Estado.ToString(),
        bodega.FechaRegistro);

    public static IEnumerable<BodegaResponseDto> ToResponseDtoList(this IEnumerable<Bodega> bodegas) =>
        bodegas.Select(b => b.ToResponseDto());

    // Reusa el mapping de Create para no duplicar campos entre Registro y Create normal
    public static CreateBodegaRequestDto ToCreateBodegaRequestDto(this RegistrarBodegaRequestDto dto) => new(
        dto.NombreBodega,
        dto.UbicacionId,
        dto.Descripcion,
        dto.AnioFundacion,
        dto.SitioWeb);
}