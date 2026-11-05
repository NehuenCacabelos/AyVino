using System.ComponentModel.DataAnnotations;
using AyVino.Api.Features.Pairings.DTOs;
using AyVino.Api.Features.Pairings.Enums;

namespace AyVino.UnitTests.Validation;

public class PairingDtoValidationTests
{
    private static CreatePairingRequestDto ValidCreatePairing() => new("Carnes Rojas", PairingCategory.Meat);
    private static UpdatePairingRequestDto ValidUpdatePairing() => new("Pastas Rellenas", PairingCategory.Pasta);

    [Fact]
    public void CreatePairingRequestDto_Valid_PassesValidation()
    {
        var dto = ValidCreatePairing();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CreatePairingRequestDto_Name_Required(string? name)
    {
        var dto = ValidCreatePairing() with { Name = name! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreatePairingRequestDto.Name)));
    }

    [Fact]
    public void CreatePairingRequestDto_Name_LengthBoundaries()
    {
        var valid = ValidCreatePairing() with { Name = new string('a', 100) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreatePairing() with { Name = new string('a', 101) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreatePairingRequestDto.Name)));
    }

    [Fact]
    public void CreatePairingRequestDto_Category_Defined_IsValid()
    {
        var dto = ValidCreatePairing() with { Category = PairingCategory.Fish };
        Assert.Empty(ValidationTestHelper.Validate(dto));
    }

    [Fact]
    public void CreatePairingRequestDto_Category_Undefined_IsInvalid()
    {
        var dto = ValidCreatePairing() with { Category = (PairingCategory)99 };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreatePairingRequestDto.Category)));
    }

    [Fact]
    public void CreatePairingRequestDto_ErrorMessage_IsSpanish()
    {
        var dto = new CreatePairingRequestDto("", (PairingCategory)99);
        var results = ValidationTestHelper.Validate(dto);
        Assert.Contains(results, r => r.ErrorMessage == "El nombre del maridaje es obligatorio.");
        Assert.Contains(results, r => r.ErrorMessage == "La categoría no es válida.");
    }

    [Fact]
    public void UpdatePairingRequestDto_Valid_PassesValidation()
    {
        var dto = ValidUpdatePairing();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }
}
