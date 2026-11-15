using System.ComponentModel.DataAnnotations;
using AyVino.Api.Features.Wineries.DTOs;

namespace AyVino.UnitTests.Validation;

public class WineryDtoValidationTests
{
    private static CreateWineryRequestDto ValidCreateWinery() => new(
        Name: "Bodega Catena Zapata",
        LocationId: 1,
        Description: "Bodega histórica de Mendoza.",
        FoundationYear: 1902,
        Website: "https://catenazapata.com"
    );

    private static UpdateWineryRequestDto ValidUpdateWinery() => new(
        Name: "Bodega Catena Zapata",
        LocationId: 1,
        Description: "Bodega histórica de Mendoza.",
        FoundationYear: 1902,
        Website: "https://catenazapata.com"
    );

    private static RegisterWineryRequestDto ValidRegisterWinery() => new(
        Username: "catena_admin",
        Email: "admin@catena.com",
        Password: "Password123!",
        WineryName: "Bodega Catena Zapata",
        LocationId: 1,
        Description: "Bodega histórica.",
        FoundationYear: 1902,
        Website: "https://catenazapata.com"
    );

    private static ChangeWineryStatusRequestDto ValidChangeStatus() => new("Approved");

    [Fact]
    public void CreateWineryRequestDto_Valid_PassesValidation()
    {
        var dto = ValidCreateWinery();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateWineryRequestDto_Name_Required(string? name)
    {
        var dto = ValidCreateWinery() with { Name = name! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateWineryRequestDto.Name)));
    }

    [Fact]
    public void CreateWineryRequestDto_Name_LengthBoundaries()
    {
        var valid = ValidCreateWinery() with { Name = new string('a', 100) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreateWinery() with { Name = new string('a', 101) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateWineryRequestDto.Name)));
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(-1, false)]
    [InlineData(1, true)]
    [InlineData(int.MaxValue, true)]
    public void CreateWineryRequestDto_LocationId_Range(int locationId, bool expectedValid)
    {
        var dto = ValidCreateWinery() with { LocationId = locationId };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(CreateWineryRequestDto.LocationId));
        Assert.Equal(!expectedValid, hasError);
    }

    [Fact]
    public void CreateWineryRequestDto_Description_LengthBoundaries()
    {
        var valid = ValidCreateWinery() with { Description = new string('a', 1000) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreateWinery() with { Description = new string('a', 1001) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateWineryRequestDto.Description)));
    }

    [Theory]
    [InlineData(999, false)]
    [InlineData(1000, true)]
    [InlineData(2100, true)]
    [InlineData(2101, false)]
    public void CreateWineryRequestDto_FoundationYear_Range(int year, bool expectedValid)
    {
        var dto = ValidCreateWinery() with { FoundationYear = year };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(CreateWineryRequestDto.FoundationYear));
        Assert.Equal(!expectedValid, hasError);
    }

    [Fact]
    public void CreateWineryRequestDto_FoundationYear_Null_Valid()
    {
        var dto = ValidCreateWinery() with { FoundationYear = null };
        Assert.Empty(ValidationTestHelper.Validate(dto));
    }

    [Theory]
    [InlineData("https://catenazapata.com", true)]
    [InlineData("http://ejemplo.org/bodega", true)]
    [InlineData("no-es-una-url", false)]
    public void CreateWineryRequestDto_Website_UrlFormat(string website, bool expectedValid)
    {
        var dto = ValidCreateWinery() with { Website = website };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(CreateWineryRequestDto.Website));
        Assert.Equal(!expectedValid, hasError);
    }

    [Fact]
    public void CreateWineryRequestDto_Website_LengthBoundaries()
    {
        var validUrl = "https://example.com/" + new string('a', 180); // 200 chars
        var valid = ValidCreateWinery() with { Website = validUrl };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalidUrl = "https://example.com/" + new string('a', 181); // 201 chars
        var invalid = ValidCreateWinery() with { Website = invalidUrl };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateWineryRequestDto.Website)));
    }

    [Fact]
    public void CreateWineryRequestDto_ErrorMessage_IsSpanish()
    {
        var dto = new CreateWineryRequestDto("", 0, FoundationYear: 500, Website: "invalido");
        var results = ValidationTestHelper.Validate(dto);
        Assert.Contains(results, r => r.ErrorMessage == "El nombre de la bodega es obligatorio.");
        Assert.Contains(results, r => r.ErrorMessage == "El id de la ubicación debe ser mayor a 0.");
        Assert.Contains(results, r => r.ErrorMessage == "El año de fundación debe estar entre 1000 y 2100.");
        Assert.Contains(results, r => r.ErrorMessage == "El sitio web debe ser una URL válida.");
    }

    [Fact]
    public void UpdateWineryRequestDto_Valid_PassesValidation()
    {
        var dto = ValidUpdateWinery();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Fact]
    public void RegisterWineryRequestDto_Valid_PassesValidation()
    {
        var dto = ValidRegisterWinery();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void RegisterWineryRequestDto_WineryName_Required(string? wineryName)
    {
        var dto = ValidRegisterWinery() with { WineryName = wineryName! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(RegisterWineryRequestDto.WineryName)));
    }

    [Fact]
    public void ChangeWineryStatusRequestDto_Valid_PassesValidation()
    {
        var dto = ValidChangeStatus();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ChangeWineryStatusRequestDto_Status_Required(string? status)
    {
        var dto = new ChangeWineryStatusRequestDto(status!);
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(ChangeWineryStatusRequestDto.Status)));
    }

    [Fact]
    public void ChangeWineryStatusRequestDto_Status_LengthBoundaries()
    {
        var valid = new ChangeWineryStatusRequestDto(new string('a', 20));
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = new ChangeWineryStatusRequestDto(new string('a', 21));
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(ChangeWineryStatusRequestDto.Status)));
    }
}
