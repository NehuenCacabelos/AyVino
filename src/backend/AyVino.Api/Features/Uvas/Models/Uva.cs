using AyVino.Api.Features.Uvas.Enums;

namespace AyVino.Api.Features.Uvas.Models;

public record Uva
{
    public int Id { get; init; }
    public string Nombre { get; init; } = string.Empty;
    public TipoColor TipoColor { get; init; }
    public CuerpoTipico? CuerpoTipico { get; init; }
    public TaninosTipico? TaninosTipico { get; init; }
    public AcidezTipica? AcidezTipica { get; init; }
    public string? Descripcion { get; init; }
}