using AyVino.Api.Features.Grapes.Enums;

namespace AyVino.Api.Features.Grapes.DTOs;

public record CreateGrapeRequestDto(
    string Name,
    ColorType ColorType,
    TypicalBody? TypicalBody = null,
    TypicalTannins? TypicalTannins = null,
    TypicalAcidity? TypicalAcidity = null,
    string? Description = null
);