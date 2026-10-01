using AyVino.Api.Features.Locations.Enums;

namespace AyVino.Api.Features.Locations.Models;

public record City
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public int StateId { get; init; }
    public CityStatus Status { get; init; } = CityStatus.Pending;
}