namespace AyVino.Api.Features.Ubicaciones.DTOs;

public record UpdateUbicacionRequestDto(
    string Pais,
    string? Provincia,
    string? Ciudad
);