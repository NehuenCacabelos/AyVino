namespace AyVino.Api.Features.Wines.DTOs;

public record CreateWineRequestDto(
    string Name,
    string WineType,
    CreateWineVintageRequestDto FirstVintage,
    int? WineryId = null,
    string? WineryNameText = null,
    string? Description = null,
    int? LocationId = null);