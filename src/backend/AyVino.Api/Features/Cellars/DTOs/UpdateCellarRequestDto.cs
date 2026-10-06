using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Cellars.DTOs;

public record UpdateCellarRequestDto(
    [property: Required, StringLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres.")] string Name);