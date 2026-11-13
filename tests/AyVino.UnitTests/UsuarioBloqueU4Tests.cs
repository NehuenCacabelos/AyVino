using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Wines.Enums;
using Xunit;

namespace AyVino.UnitTests;

public class UsuarioBloqueU4Tests
{
    [Fact]
    public void CellarMappingExtensions_Maps_WineryName_RegionName_And_GrapeName()
    {
        var row = new CellarItemListRow
        {
            WineVintageId = 10,
            WineId = 42,
            Name = "Catena Zapata Malbec Argentino",
            WineType = WineType.Red,
            WineryId = 5,
            WineryNameText = null,
            WineryName = "Bodega Catena Zapata",
            RegionName = "Gualtallary, Mendoza",
            GrapeName = "Malbec",
            Year = 2020,
            ImageId = Guid.NewGuid(),
            RatingSum = 45,
            ReviewCount = 10,
            Quantity = 3,
            PurchaseDate = new DateOnly(2023, 5, 12),
            Notes = "A2 - Estante Superior",
            LastChangeAt = DateTime.UtcNow
        };

        var dto = row.ToResponseDto();

        Assert.Equal(10, dto.WineVintageId);
        Assert.Equal(42, dto.WineId);
        Assert.Equal("Catena Zapata Malbec Argentino", dto.Name);
        Assert.Equal("Red", dto.WineType);
        Assert.Equal(5, dto.WineryId);
        Assert.Equal("Bodega Catena Zapata", dto.WineryName);
        Assert.Equal("Gualtallary, Mendoza", dto.RegionName);
        Assert.Equal("Malbec", dto.GrapeName);
        Assert.Equal(2020, dto.Year);
        Assert.Equal(4.5m, dto.AverageRating);
        Assert.Equal(10, dto.ReviewCount);
        Assert.Equal(3, dto.Quantity);
        Assert.Equal("A2 - Estante Superior", dto.Notes);
    }

    [Fact]
    public void CellarMappingExtensions_Handles_Null_Ratings_And_Values_Gracefully()
    {
        var row = new CellarItemListRow
        {
            WineVintageId = 11,
            WineId = 43,
            Name = "Vino Casero",
            WineType = WineType.White,
            WineryId = null,
            WineryNameText = "Don Pedro",
            WineryName = null,
            RegionName = null,
            GrapeName = null,
            Year = null,
            ImageId = null,
            RatingSum = 0,
            ReviewCount = 0,
            Quantity = 1,
            PurchaseDate = null,
            Notes = null,
            LastChangeAt = DateTime.UtcNow
        };

        var dto = row.ToResponseDto();

        Assert.Null(dto.AverageRating);
        Assert.Null(dto.WineryName);
        Assert.Null(dto.RegionName);
        Assert.Null(dto.GrapeName);
        Assert.Equal("Don Pedro", dto.WineryNameText);
        Assert.Equal(1, dto.Quantity);
    }
}
