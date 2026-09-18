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
}