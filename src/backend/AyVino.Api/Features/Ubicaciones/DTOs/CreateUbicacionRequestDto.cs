namespace AyVino.Api.Features.Ubicaciones.DTOs;

public record CreateUbicacionRequestDto(
    string Pais,
    string? Provincia = null,
    string? Ciudad = null
);