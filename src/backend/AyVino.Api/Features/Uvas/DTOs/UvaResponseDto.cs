namespace AyVino.Api.Features.Uvas.DTOs;

public record UvaResponseDto(
    int Id,
    string Nombre,
    string TipoColor,
    string? CuerpoTipico,
    string? TaninosTipico,
    string? AcidezTipica,
    string? Descripcion
);