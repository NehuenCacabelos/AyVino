namespace AyVino.Api.Features.Wines.DTOs;

public record MatchedWineDto(int Id, string Name, string Winery, string Type);

public record MatchedVintageDto(int Id, int? Year, string ApprovalStatus);

public record WineMatchResultDto(MatchedWineDto? Wine, MatchedVintageDto? Vintage);
