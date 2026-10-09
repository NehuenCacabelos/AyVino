using System.ComponentModel.DataAnnotations;
using AyVino.Api.Features.Locations.DTOs;

namespace AyVino.UnitTests.Validation;

public class LocationDtoValidationTests
{
    private static CreateCityRequestDto ValidCreateCity() => new("Mendoza", 12);
    private static CreateLocationRequestDto ValidCreateLocation() => new(1);
    private static UpdateCityStatusRequestDto ValidUpdateCityStatus() => new("Approved");

    [Fact]
    public void CreateCityRequestDto_Valid_PassesValidation()
    {
        var dto = ValidCreateCity();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateCityRequestDto_Name_Required(string? name)
    {
        var dto = ValidCreateCity() with { Name = name! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateCityRequestDto.Name)));
    }

    [Fact]
    public void CreateCityRequestDto_Name_LengthBoundaries()
    {
        var valid = ValidCreateCity() with { Name = new string('a', 100) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreateCity() with { Name = new string('a', 101) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateCityRequestDto.Name)));
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(-1, false)]
    [InlineData(1, true)]
    [InlineData(int.MaxValue, true)]
    public void CreateCityRequestDto_StateId_Range(int stateId, bool expectedValid)
    {
        var dto = ValidCreateCity() with { StateId = stateId };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(CreateCityRequestDto.StateId));
        Assert.Equal(!expectedValid, hasError);
    }

    [Fact]
    public void CreateCityRequestDto_ErrorMessage_IsSpanish()
    {
        var dto = new CreateCityRequestDto("", 0);
        var results = ValidationTestHelper.Validate(dto);
        Assert.Contains(results, r => r.ErrorMessage == "El nombre de la ciudad es obligatorio.");
        Assert.Contains(results, r => r.ErrorMessage == "El id de la provincia debe ser mayor a 0.");
    }

    [Fact]
    public void CreateLocationRequestDto_Valid_PassesValidation()
    {
        var dto = ValidCreateLocation();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(-1, false)]
    [InlineData(1, true)]
    [InlineData(int.MaxValue, true)]
    public void CreateLocationRequestDto_CityId_Range(int cityId, bool expectedValid)
    {
        var dto = new CreateLocationRequestDto(cityId);
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(CreateLocationRequestDto.CityId));
        Assert.Equal(!expectedValid, hasError);
    }

    [Fact]
    public void UpdateCityStatusRequestDto_Valid_PassesValidation()
    {
        var dto = ValidUpdateCityStatus();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void UpdateCityStatusRequestDto_Status_Required(string? status)
    {
        var dto = new UpdateCityStatusRequestDto(status!);
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(UpdateCityStatusRequestDto.Status)));
    }

    [Fact]
    public void UpdateCityStatusRequestDto_Status_LengthBoundaries()
    {
        var valid = new UpdateCityStatusRequestDto(new string('a', 20));
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = new UpdateCityStatusRequestDto(new string('a', 21));
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(UpdateCityStatusRequestDto.Status)));
    }
}
