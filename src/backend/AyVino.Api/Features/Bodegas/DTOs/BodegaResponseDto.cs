namespace AyVino.Api.Features.Bodegas.DTOs;

public record BodegaResponseDto(
    int Id,
    string Nombre,
    string? Descripcion,
    int UbicacionId,
    int? AnioFundacion,
    string? SitioWeb,
    int? UsuarioId,
    string Estado,
    DateTime FechaRegistro);