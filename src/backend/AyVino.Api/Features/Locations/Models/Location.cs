namespace AyVino.Api.Features.Locations.Models;

public record Location
{
    public int Id { get; init; }
    public int CityId { get; init; }
    public string CityName { get; init; } = string.Empty;
    public int StateId { get; init; }
    public string StateName { get; init; } = string.Empty;
}