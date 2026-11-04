namespace AyVino.Api.Features.Cellars.Models;

public record CellarGrapeBreakdownRow(
    int GrapeId,
    string GrapeName,
    decimal TotalWeight);
