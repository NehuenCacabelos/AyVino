namespace AyVino.Api.Features.Bodegas.DTOs;

public record RegistrarBodegaRequestDto(
    // Datos del usuario dueño (se crea con Rol="Bodega")
    string NombreUsuario,
    string Email,
    string Password,
    // Datos de la bodega
    string NombreBodega,
    int UbicacionId,
    string? Descripcion = null,
    int? AnioFundacion = null,
    string? SitioWeb = null);