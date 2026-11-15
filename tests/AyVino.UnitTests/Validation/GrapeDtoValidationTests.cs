using System.ComponentModel.DataAnnotations;
using AyVino.Api.Features.Grapes.DTOs;
using AyVino.Api.Features.Grapes.Enums;

namespace AyVino.UnitTests.Validation;

public class GrapeDtoValidationTests
{
    private static CreateGrapeRequestDto ValidCreateGrape() => new(
        Name: "Malbec",
        ColorType: ColorType.Red,
        TypicalBody: TypicalBody.Full,
        TypicalTannins: TypicalTannins.Astringent,
        TypicalAcidity: TypicalAcidity.Medium,
        Description: "Cepa insignia de Argentina."
    );

    private static UpdateGrapeRequestDto ValidUpdateGrape() => new(
        Name: "Cabernet Franc",
        ColorType: ColorType.Red,
        TypicalBody: TypicalBody.Medium,
        TypicalTannins: TypicalTannins.Medium,
        TypicalAcidity: TypicalAcidity.High,
        Description: "Varietal de gran elegancia."
    );

    [Fact]
    public void CreateGrapeRequestDto_Valid_PassesValidation()
    {
        var dto = ValidCreateGrape();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateGrapeRequestDto_Name_Required(string? name)
    {
        var dto = ValidCreateGrape() with { Name = name! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateGrapeRequestDto.Name)));
    }

    [Fact]
    public void CreateGrapeRequestDto_Name_LengthBoundaries()
    {
        var valid = ValidCreateGrape() with { Name = new string('a', 100) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreateGrape() with { Name = new string('a', 101) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateGrapeRequestDto.Name)));
    }

    [Fact]
    public void CreateGrapeRequestDto_ColorType_Defined_IsValid()
    {
        var dto = ValidCreateGrape() with { ColorType = ColorType.White };
        Assert.Empty(ValidationTestHelper.Validate(dto));
    }

    [Fact]
    public void CreateGrapeRequestDto_ColorType_Undefined_IsInvalid()
    {
        var dto = ValidCreateGrape() with { ColorType = (ColorType)99 };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateGrapeRequestDto.ColorType)));
    }

    [Fact]
    public void CreateGrapeRequestDto_NullableEnums_Null_AreValid()
    {
        var dto = ValidCreateGrape() with
        {
            TypicalBody = null,
            TypicalTannins = null,
            TypicalAcidity = null
        };
        Assert.Empty(ValidationTestHelper.Validate(dto));
    }

    [Fact]
    public void CreateGrapeRequestDto_TypicalBody_Undefined_IsInvalid()
    {
        var dto = ValidCreateGrape() with { TypicalBody = (TypicalBody)99 };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateGrapeRequestDto.TypicalBody)));
    }

    [Fact]
    public void CreateGrapeRequestDto_TypicalTannins_Undefined_IsInvalid()
    {
        var dto = ValidCreateGrape() with { TypicalTannins = (TypicalTannins)99 };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateGrapeRequestDto.TypicalTannins)));
    }

    [Fact]
    public void CreateGrapeRequestDto_TypicalAcidity_Undefined_IsInvalid()
    {
        var dto = ValidCreateGrape() with { TypicalAcidity = (TypicalAcidity)99 };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateGrapeRequestDto.TypicalAcidity)));
    }

    [Fact]
    public void CreateGrapeRequestDto_Description_LengthBoundaries()
    {
        var valid = ValidCreateGrape() with { Description = new string('a', 1000) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreateGrape() with { Description = new string('a', 1001) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateGrapeRequestDto.Description)));
    }

    [Fact]
    public void CreateGrapeRequestDto_ErrorMessage_IsSpanish()
    {
        var dto = new CreateGrapeRequestDto("", (ColorType)99);
        var results = ValidationTestHelper.Validate(dto);
        Assert.Contains(results, r => r.ErrorMessage == "El nombre de la uva es obligatorio.");
        Assert.Contains(results, r => r.ErrorMessage == "El tipo de color no es válido.");
    }

    [Fact]
    public void UpdateGrapeRequestDto_Valid_PassesValidation()
    {
        var dto = ValidUpdateGrape();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }
}
