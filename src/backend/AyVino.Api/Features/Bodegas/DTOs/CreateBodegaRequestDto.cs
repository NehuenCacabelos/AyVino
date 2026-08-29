namespace AyVino.Api.Features.Bodegas.DTOs;

public record CreateBodegaRequestDto(
    string Nombre,
    int UbicacionId,
    string? Descripcion = null,
    int? AnioFundacion = null,
    string? SitioWeb = null);