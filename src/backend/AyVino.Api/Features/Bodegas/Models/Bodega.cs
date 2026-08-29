using AyVino.Api.Features.Bodegas.Enums;

namespace AyVino.Api.Features.Bodegas.Models;

public record Bodega
{
    public int Id { get; init; }
    public string Nombre { get; init; } = string.Empty;
    public string? Descripcion { get; init; }
    public int UbicacionId { get; init; }
    public int? AnioFundacion { get; init; }
    public string? SitioWeb { get; init; }
    public int? UsuarioId { get; init; }
    public EstadoBodega Estado { get; init; }
    public DateTime FechaRegistro { get; init; }
}