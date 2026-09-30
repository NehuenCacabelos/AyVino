namespace AyVino.Api.Features.Locations.Models;

public record Location
{
    public int Id { get; init; }
    public int CityId { get; init; }
}