namespace AyVino.Api.Features.Grapes.DTOs;

public record GrapeResponseDto(
    int Id,
    string Name,
    string ColorType,
    string? TypicalBody,
    string? TypicalTannins,
    string? TypicalAcidity,
    string? Description
);