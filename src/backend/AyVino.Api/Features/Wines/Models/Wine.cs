using AyVino.Api.Features.Wines.Enums;

namespace AyVino.Api.Features.Wines.Models;

public record Wine
{
    public int Id { get; init; }
    public int? WineryId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public WineType WineType { get; init; }
    public int? LocationId { get; init; }
    public int? Year { get; init; }
    public decimal? AlcoholContent { get; init; }
    public int? ServingTemperature { get; init; }
    public string? AgingAdvice { get; init; }
    public string? LabelImageUrl { get; init; }
    public ApprovalStatus ApprovalStatus { get; init; }
    public int UploadedByUserId { get; init; }
    public DateTime RegisterDate { get; init; }

    // Texto libre con el nombre de bodega tipeado por el usuario cuando WineryId es null
    // (todavía no existe cuenta de esa bodega). Es la "pista" que usa /claim-wines para matchear.
    public string? WineryNameText { get; init; }
    public SourceType SourceType { get; init; }

    // Self-FK: si este vino terminó fusionado a otro, acá queda la referencia al "main".
    public int? DuplicateOfWineId { get; init; }
}