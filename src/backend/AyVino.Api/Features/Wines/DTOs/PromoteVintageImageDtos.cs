using System.ComponentModel.DataAnnotations;

namespace AyVino.Api.Features.Wines.DTOs;

public record PromoteVintageImageRequestDto(
    [property: Range(1, int.MaxValue, ErrorMessage = "UserId debe ser mayor a 0.")] int UserId
);

public record PromoteVintageImageResponseDto(
    int VintageId,
    Guid ImageId
);
