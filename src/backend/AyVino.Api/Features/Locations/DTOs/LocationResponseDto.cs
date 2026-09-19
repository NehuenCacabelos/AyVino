namespace AyVino.Api.Features.Locations.DTOs;

public record LocationResponseDto(int Id, int CityId, string CityName, int StateId, string StateName);