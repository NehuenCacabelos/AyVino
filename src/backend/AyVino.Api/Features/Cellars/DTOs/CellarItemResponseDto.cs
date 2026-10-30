namespace AyVino.Api.Features.Cellars.DTOs;

public record CellarItemResponseDto(
    int WineVintageId,
    int WineId,
    string Name,
    string WineType,
    int? WineryId,
    string? WineryNameText,
    int? Year,
    Guid? ImageId,
    decimal? AverageRating,
    int ReviewCount,
    int Quantity,
    DateOnly? PurchaseDate,
    string? Notes,
    DateTime LastChangeAt);
