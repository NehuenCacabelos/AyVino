namespace AyVino.Api.Features.History.DTOs;

public record HistoryWineDto(
    int Id,
    string Name,
    string? WineryName,
    string WineType);

public record HistoryVintageDto(
    int Id,
    int? Year,
    Guid? ImageId);

public record HistoryItemDto(
    long Id,
    string Type,
    DateTime OccurredAt,
    HistoryWineDto Wine,
    HistoryVintageDto? Vintage,
    Guid? PersonalImageId,
    int? Rating,
    string? Comment);
