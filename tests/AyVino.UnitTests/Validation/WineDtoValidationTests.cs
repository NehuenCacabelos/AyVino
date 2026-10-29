using System.ComponentModel.DataAnnotations;
using AyVino.Api.Features.Wines.DTOs;

namespace AyVino.UnitTests.Validation;

public class WineDtoValidationTests
{
    private static CreateWineVintageRequestDto ValidVintage() => new(
        Year: 2020,
        AlcoholContent: 14.5m,
        ServingTemperature: 16,
        AgingAdvice: "Beber dentro de 5 años.",
        ImageUrl: "https://example.com/vintage.jpg",
        Grapes: [new WineGrapeRequestDto(1, 100m)]
    );

    private static CreateWineRequestDto ValidCreateWine() => new(
        Name: "Rutini Cabernet Malbec",
        WineType: "Tinto",
        FirstVintage: ValidVintage(),
        WineryId: 1,
        WineryNameText: "Rutini Wines",
        Description: "Gran vino de corte mendocino.",
        LocationId: 1
    );

    private static UpdateWineRequestDto ValidUpdateWine() => new(
        Name: "Rutini Cabernet Malbec",
        WineType: "Tinto",
        WineryId: 1,
        WineryNameText: "Rutini Wines",
        Description: "Gran vino de corte mendocino.",
        LocationId: 1
    );

    private static WineGrapeRequestDto ValidWineGrape() => new(1, 85.5m);
    private static ChangeWineVintageStatusRequestDto ValidChangeStatus() => new("Approved");
    private static ClaimWinesRequestDto ValidClaimWines() => new([1, 2, 3]);

    [Fact]
    public void CreateWineRequestDto_Valid_PassesValidation()
    {
        var dto = ValidCreateWine();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateWineRequestDto_Name_Required(string? name)
    {
        var dto = ValidCreateWine() with { Name = name! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateWineRequestDto.Name)));
    }

    [Fact]
    public void CreateWineRequestDto_Name_LengthBoundaries()
    {
        var valid = ValidCreateWine() with { Name = new string('a', 150) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreateWine() with { Name = new string('a', 151) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateWineRequestDto.Name)));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateWineRequestDto_WineType_Required(string? wineType)
    {
        var dto = ValidCreateWine() with { WineType = wineType! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateWineRequestDto.WineType)));
    }

    [Fact]
    public void CreateWineRequestDto_WineType_LengthBoundaries()
    {
        var valid = ValidCreateWine() with { WineType = new string('a', 30) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreateWine() with { WineType = new string('a', 31) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateWineRequestDto.WineType)));
    }

    [Fact]
    public void CreateWineRequestDto_FirstVintage_Required()
    {
        var dto = ValidCreateWine() with { FirstVintage = null! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateWineRequestDto.FirstVintage)));
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(-1, false)]
    [InlineData(1, true)]
    public void CreateWineRequestDto_WineryId_Range(int wineryId, bool expectedValid)
    {
        var dto = ValidCreateWine() with { WineryId = wineryId };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(CreateWineRequestDto.WineryId));
        Assert.Equal(!expectedValid, hasError);
    }

    [Fact]
    public void CreateWineRequestDto_WineryId_Null_Valid()
    {
        var dto = ValidCreateWine() with { WineryId = null };
        Assert.Empty(ValidationTestHelper.Validate(dto));
    }

    [Fact]
    public void CreateWineRequestDto_WineryNameText_LengthBoundaries()
    {
        var valid = ValidCreateWine() with { WineryNameText = new string('a', 150) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreateWine() with { WineryNameText = new string('a', 151) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateWineRequestDto.WineryNameText)));
    }

    [Fact]
    public void CreateWineRequestDto_Description_LengthBoundaries()
    {
        var valid = ValidCreateWine() with { Description = new string('a', 1000) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreateWine() with { Description = new string('a', 1001) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateWineRequestDto.Description)));
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(-1, false)]
    [InlineData(1, true)]
    public void CreateWineRequestDto_LocationId_Range(int locationId, bool expectedValid)
    {
        var dto = ValidCreateWine() with { LocationId = locationId };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(CreateWineRequestDto.LocationId));
        Assert.Equal(!expectedValid, hasError);
    }

    [Fact]
    public void CreateWineRequestDto_ErrorMessage_IsSpanish()
    {
        var dto = new CreateWineRequestDto("", "", null!, WineryId: 0);
        var results = ValidationTestHelper.Validate(dto);
        Assert.Contains(results, r => r.ErrorMessage == "El nombre del vino es obligatorio.");
        Assert.Contains(results, r => r.ErrorMessage == "El tipo de vino es obligatorio.");
        Assert.Contains(results, r => r.ErrorMessage == "La primera cosecha es obligatoria.");
        Assert.Contains(results, r => r.ErrorMessage == "El id de la bodega debe ser mayor a 0.");
    }

    [Fact]
    public void UpdateWineRequestDto_Valid_PassesValidation()
    {
        var dto = ValidUpdateWine();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Fact]
    public void CreateWineVintageRequestDto_Valid_PassesValidation()
    {
        var dto = ValidVintage();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(1799, false)]
    [InlineData(1800, true)]
    [InlineData(2100, true)]
    [InlineData(2101, false)]
    public void CreateWineVintageRequestDto_Year_Range(int year, bool expectedValid)
    {
        var dto = ValidVintage() with { Year = year };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(CreateWineVintageRequestDto.Year));
        Assert.Equal(!expectedValid, hasError);
    }

    [Fact]
    public void CreateWineVintageRequestDto_Year_Null_Valid()
    {
        var dto = ValidVintage() with { Year = null };
        Assert.Empty(ValidationTestHelper.Validate(dto));
    }

    [Theory]
    [InlineData(-0.01, false)]
    [InlineData(0.0, true)]
    [InlineData(14.5, true)]
    [InlineData(99.99, true)]
    [InlineData(100.0, false)]
    public void CreateWineVintageRequestDto_AlcoholContent_Range(double alcohol, bool expectedValid)
    {
        var dto = ValidVintage() with { AlcoholContent = (decimal)alcohol };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(CreateWineVintageRequestDto.AlcoholContent));
        Assert.Equal(!expectedValid, hasError);
    }

    [Theory]
    [InlineData(-1, false)]
    [InlineData(0, true)]
    [InlineData(18, true)]
    [InlineData(30, true)]
    [InlineData(31, false)]
    public void CreateWineVintageRequestDto_ServingTemperature_Range(int temp, bool expectedValid)
    {
        var dto = ValidVintage() with { ServingTemperature = temp };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(CreateWineVintageRequestDto.ServingTemperature));
        Assert.Equal(!expectedValid, hasError);
    }

    [Fact]
    public void CreateWineVintageRequestDto_AgingAdvice_LengthBoundaries()
    {
        var valid = ValidVintage() with { AgingAdvice = new string('a', 500) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidVintage() with { AgingAdvice = new string('a', 501) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateWineVintageRequestDto.AgingAdvice)));
    }

    [Theory]
    [InlineData("https://example.com/image.png", true)]
    [InlineData("x", false)]
    [InlineData("no-url", false)]
    public void CreateWineVintageRequestDto_ImageUrl_UrlFormat(string url, bool expectedValid)
    {
        var dto = ValidVintage() with { ImageUrl = url };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(CreateWineVintageRequestDto.ImageUrl));
        Assert.Equal(!expectedValid, hasError);
    }

    [Fact]
    public void CreateWineVintageRequestDto_ImageUrl_LengthBoundaries()
    {
        var validUrl = "https://example.com/" + new string('a', 280); // 300 chars
        var valid = ValidVintage() with { ImageUrl = validUrl };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalidUrl = "https://example.com/" + new string('a', 281); // 301 chars
        var invalid = ValidVintage() with { ImageUrl = invalidUrl };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateWineVintageRequestDto.ImageUrl)));
    }

    [Fact]
    public void CreateWineVintageRequestDto_Grapes_MaxLength20()
    {
        var grapes20 = Enumerable.Range(1, 20).Select(i => new WineGrapeRequestDto(i, 5m)).ToList();
        var valid = ValidVintage() with { Grapes = grapes20 };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var grapes21 = Enumerable.Range(1, 21).Select(i => new WineGrapeRequestDto(i, 4m)).ToList();
        var invalid = ValidVintage() with { Grapes = grapes21 };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateWineVintageRequestDto.Grapes)));
    }

    [Fact]
    public void WineGrapeRequestDto_Valid_PassesValidation()
    {
        var dto = ValidWineGrape();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(-1, false)]
    [InlineData(1, true)]
    public void WineGrapeRequestDto_GrapeId_Range(int grapeId, bool expectedValid)
    {
        var dto = ValidWineGrape() with { GrapeId = grapeId };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(WineGrapeRequestDto.GrapeId));
        Assert.Equal(!expectedValid, hasError);
    }

    [Theory]
    [InlineData(0.00, false)]
    [InlineData(0.01, true)]
    [InlineData(50.0, true)]
    [InlineData(100.0, true)]
    [InlineData(100.01, false)]
    public void WineGrapeRequestDto_Percentage_Range(double percentage, bool expectedValid)
    {
        var dto = ValidWineGrape() with { Percentage = (decimal)percentage };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(WineGrapeRequestDto.Percentage));
        Assert.Equal(!expectedValid, hasError);
    }

    [Fact]
    public void WineGrapeRequestDto_Percentage_Null_Valid()
    {
        var dto = ValidWineGrape() with { Percentage = null };
        Assert.Empty(ValidationTestHelper.Validate(dto));
    }

    [Fact]
    public void ChangeWineVintageStatusRequestDto_Valid_PassesValidation()
    {
        var dto = ValidChangeStatus();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ChangeWineVintageStatusRequestDto_Status_Required(string? status)
    {
        var dto = new ChangeWineVintageStatusRequestDto(status!);
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(ChangeWineVintageStatusRequestDto.Status)));
    }

    [Fact]
    public void ChangeWineVintageStatusRequestDto_Status_LengthBoundaries()
    {
        var valid = new ChangeWineVintageStatusRequestDto(new string('a', 20));
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = new ChangeWineVintageStatusRequestDto(new string('a', 21));
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(ChangeWineVintageStatusRequestDto.Status)));
    }

    [Fact]
    public void ClaimWinesRequestDto_Valid_PassesValidation()
    {
        var dto = ValidClaimWines();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Fact]
    public void ClaimWinesRequestDto_Null_IsInvalid()
    {
        var dto = new ClaimWinesRequestDto(null!);
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(ClaimWinesRequestDto.WineIds)));
    }

    [Fact]
    public void ClaimWinesRequestDto_EmptyList_IsInvalid()
    {
        var dto = new ClaimWinesRequestDto([]);
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(ClaimWinesRequestDto.WineIds)));
        Assert.Contains(results, r => r.ErrorMessage == "Debe indicar al menos un vino.");
    }
}
