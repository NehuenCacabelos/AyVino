namespace AyVino.Api.Features.Ubicaciones.DTOs;

public record UbicacionResponseDto(
    int Id,
    string Pais,
    string? Provincia,
    string? Ciudad
);