using System.ComponentModel.DataAnnotations;
using AyVino.Api.Features.Cellars.DTOs;

namespace AyVino.UnitTests.Validation;

public class CellarDtoValidationTests
{
    private static CreateCellarRequestDto ValidCreateCellar() => new("Cava Principal");
    private static UpdateCellarRequestDto ValidUpdateCellar() => new("Cava Modificada");
    private static AddCellarItemRequestDto ValidAddCellarItem() => new(
        WineVintageId: 10,
        Quantity: 6,
        PurchaseDate: new DateOnly(2025, 5, 20),
        Notes: "Comprado en feria de vinos."
    );
    private static UpdateCellarItemRequestDto ValidUpdateCellarItem() => new(
        Quantity: 12,
        PurchaseDate: new DateOnly(2025, 5, 20),
        Notes: "Reabastecimiento."
    );

    [Fact]
    public void CreateCellarRequestDto_Valid_PassesValidation()
    {
        var dto = ValidCreateCellar();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateCellarRequestDto_Name_Required(string? name)
    {
        var dto = ValidCreateCellar() with { Name = name! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateCellarRequestDto.Name)));
        Assert.Contains(results, r => r.ErrorMessage == "El nombre de la cava es obligatorio.");
    }

    [Fact]
    public void CreateCellarRequestDto_Name_LengthBoundaries()
    {
        var valid = ValidCreateCellar() with { Name = new string('a', 100) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreateCellar() with { Name = new string('a', 101) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateCellarRequestDto.Name)));
    }

    [Fact]
    public void UpdateCellarRequestDto_Valid_PassesValidation()
    {
        var dto = ValidUpdateCellar();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void UpdateCellarRequestDto_Name_Required(string? name)
    {
        var dto = ValidUpdateCellar() with { Name = name! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(UpdateCellarRequestDto.Name)));
        Assert.Contains(results, r => r.ErrorMessage == "El nombre de la cava es obligatorio.");
    }

    [Fact]
    public void AddCellarItemRequestDto_Valid_PassesValidation()
    {
        var dto = ValidAddCellarItem();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(-1, false)]
    [InlineData(1, true)]
    [InlineData(int.MaxValue, true)]
    public void AddCellarItemRequestDto_WineVintageId_Range(int vintageId, bool expectedValid)
    {
        var dto = ValidAddCellarItem() with { WineVintageId = vintageId };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(AddCellarItemRequestDto.WineVintageId));
        Assert.Equal(!expectedValid, hasError);
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(1, true)]
    [InlineData(999, true)]
    [InlineData(1000, false)]
    public void AddCellarItemRequestDto_Quantity_Range(int qty, bool expectedValid)
    {
        var dto = ValidAddCellarItem() with { Quantity = qty };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(AddCellarItemRequestDto.Quantity));
        Assert.Equal(!expectedValid, hasError);
    }

    [Fact]
    public void AddCellarItemRequestDto_Notes_LengthBoundaries()
    {
        var valid = ValidAddCellarItem() with { Notes = new string('a', 500) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidAddCellarItem() with { Notes = new string('a', 501) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(AddCellarItemRequestDto.Notes)));
    }

    [Fact]
    public void UpdateCellarItemRequestDto_Valid_PassesValidation()
    {
        var dto = ValidUpdateCellarItem();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(1, true)]
    [InlineData(999, true)]
    [InlineData(1000, false)]
    public void UpdateCellarItemRequestDto_Quantity_Range(int qty, bool expectedValid)
    {
        var dto = ValidUpdateCellarItem() with { Quantity = qty };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(UpdateCellarItemRequestDto.Quantity));
        Assert.Equal(!expectedValid, hasError);
    }
}
