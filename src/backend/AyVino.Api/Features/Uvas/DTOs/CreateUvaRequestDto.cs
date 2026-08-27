using AyVino.Api.Features.Uvas.Enums;

namespace AyVino.Api.Features.Uvas.DTOs;

public record CreateUvaRequestDto(
    string Nombre,
    TipoColor TipoColor,
    CuerpoTipico? CuerpoTipico = null,
    TaninosTipico? TaninosTipico = null,
    AcidezTipica? AcidezTipica = null,
    string? Descripcion = null
);