namespace AyVino.Api.Features.Wines.DTOs;

public record UpdateWineRequestDto(
    string Name,
    string WineType,
    int? WineryId = null,
    string? WineryNameText = null,
    string? Description = null,
    int? LocationId = null);