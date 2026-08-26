namespace AyVino.Api.Features.Ubicaciones.Models;

public record Ubicacion
{
    public int Id { get; init; }
    public string Pais { get; init; } = string.Empty;
    public string? Provincia { get; init; }
    public string? Ciudad { get; init; }
}