using AyVino.Api.Features.Wines.Enums;

namespace AyVino.Api.Features.Wines.Models;

public record AdminWineVintageListRow
{
    public int VintageId { get; init; }
    public int WineId { get; init; }
    public string WineName { get; init; } = string.Empty;
    public WineType WineType { get; init; }
    public int? WineryId { get; init; }
    public string? WineryName { get; init; }
    public int? Year { get; init; }
    public decimal? AlcoholContent { get; init; }
    public string? ImageUrl { get; init; }
    public ApprovalStatus ApprovalStatus { get; init; }
    public int UploadedByUserId { get; init; }
    public string? UploadedByUsername { get; init; }
    public DateTime RegisterDate { get; init; }
}
