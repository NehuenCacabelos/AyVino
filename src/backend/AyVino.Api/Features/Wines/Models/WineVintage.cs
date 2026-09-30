using AyVino.Api.Features.Wines.Enums;

namespace AyVino.Api.Features.Wines.Models;

public record WineVintage
{
    public int Id { get; init; }
    public int WineId { get; init; }
    public int? Year { get; init; }
    public decimal? AlcoholContent { get; init; }
    public int? ServingTemperature { get; init; }
    public string? AgingAdvice { get; init; }
    public string? ImageUrl { get; init; }
    public ApprovalStatus ApprovalStatus { get; init; }
    public int UploadedByUserId { get; init; }
    public DateTime RegisterDate { get; init; }
    public int RatingSum { get; init; }
    public int ReviewCount { get; init; }
}