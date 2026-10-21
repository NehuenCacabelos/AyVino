using System.Text.Json;
using System.Text.Json.Serialization;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Grapes.DTOs;
using AyVino.Api.Features.Grapes.Enums;
using AyVino.UnitTests.Validation;

namespace AyVino.UnitTests.Common;

public class JsonContractTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter() }
    };

    [Fact]
    public void Serialize_EnumProperty_SerializesAsString()
    {
        var dto = new CreateGrapeRequestDto(
            Name: "Malbec",
            ColorType: ColorType.Red,
            TypicalBody: TypicalBody.Full,
            TypicalTannins: TypicalTannins.Astringent,
            TypicalAcidity: TypicalAcidity.Medium
        );

        var json = JsonSerializer.Serialize(dto, JsonOptions);

        Assert.Contains("\"colorType\":\"Red\"", json);
        Assert.Contains("\"typicalBody\":\"Full\"", json);
        Assert.DoesNotContain("\"colorType\":1", json);
    }

    [Fact]
    public void Deserialize_EnumAsString_DeserializesSuccessfully()
    {
        var json = """
        {
            "name": "Malbec",
            "colorType": "Red",
            "typicalBody": "Full",
            "typicalTannins": "Astringent",
            "typicalAcidity": "Medium"
        }
        """;

        var dto = JsonSerializer.Deserialize<CreateGrapeRequestDto>(json, JsonOptions);

        Assert.NotNull(dto);
        Assert.Equal(ColorType.Red, dto.ColorType);
        Assert.Equal(TypicalBody.Full, dto.TypicalBody);
        Assert.Equal(TypicalTannins.Astringent, dto.TypicalTannins);
        Assert.Equal(TypicalAcidity.Medium, dto.TypicalAcidity);
    }

    [Fact]
    public void Deserialize_EnumAsNumber_DeserializesSuccessfully()
    {
        var json = """
        {
            "name": "Malbec",
            "colorType": 1,
            "typicalBody": 50,
            "typicalTannins": 50,
            "typicalAcidity": 30
        }
        """;

        var dto = JsonSerializer.Deserialize<CreateGrapeRequestDto>(json, JsonOptions);

        Assert.NotNull(dto);
        Assert.Equal(ColorType.Red, dto.ColorType);
        Assert.Equal(TypicalBody.Full, dto.TypicalBody);
        Assert.Equal(TypicalTannins.Astringent, dto.TypicalTannins);
        Assert.Equal(TypicalAcidity.Medium, dto.TypicalAcidity);
    }

    [Fact]
    public void Deserialize_InvalidEnumString_ThrowsJsonException()
    {
        var json = """
        {
            "name": "Malbec",
            "colorType": "ColorInexistente"
        }
        """;

        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<CreateGrapeRequestDto>(json, JsonOptions));
    }

    [Fact]
    public void Deserialize_UndefinedEnumNumber_FailsEnumDataTypeValidation()
    {
        var json = """
        {
            "name": "Malbec",
            "colorType": 99
        }
        """;

        var dto = JsonSerializer.Deserialize<CreateGrapeRequestDto>(json, JsonOptions);
        Assert.NotNull(dto);

        var validationResults = ValidationTestHelper.Validate(dto);
        Assert.NotEmpty(validationResults);
        Assert.Contains(validationResults, r => r.ErrorMessage == "El tipo de color no es válido.");
    }

    [Fact]
    public void SerializeAndDeserialize_DateOnly_UsesIsoFormat()
    {
        var originalDto = new AddCellarItemRequestDto(
            WineVintageId: 5,
            Quantity: 2,
            PurchaseDate: new DateOnly(2026, 5, 20),
            Notes: "Cosecha especial"
        );

        var json = JsonSerializer.Serialize(originalDto, JsonOptions);

        Assert.Contains("\"purchaseDate\":\"2026-05-20\"", json);

        var deserialized = JsonSerializer.Deserialize<AddCellarItemRequestDto>(json, JsonOptions);
        Assert.NotNull(deserialized);
        Assert.Equal(new DateOnly(2026, 5, 20), deserialized.PurchaseDate);
    }
}
