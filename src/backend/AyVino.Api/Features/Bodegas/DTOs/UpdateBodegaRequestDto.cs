namespace AyVino.Api.Features.Bodegas.DTOs;

public record UpdateBodegaRequestDto(
    string Nombre,
    int UbicacionId,
    string? Descripcion = null,
    int? AnioFundacion = null,
    string? SitioWeb = null);