namespace AyVino.Api.Features.Wines.DTOs;

public record VintageContributionDto(
    int UserId,
    string Username,
    Guid? PersonalImageId,
    bool IsUploader
);
