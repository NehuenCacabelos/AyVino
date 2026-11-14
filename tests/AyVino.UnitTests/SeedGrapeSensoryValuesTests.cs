using AyVino.Api.Features.Grapes.Enums;
using AyVino.Api.Migrations;
using Xunit;

namespace AyVino.UnitTests;

public class SeedGrapeSensoryValuesTests
{
    private static readonly short[] AllowedValues = [10, 20, 30, 40, 50];

    [Fact]
    public void SeedGrapeSensoryValues_ContainsExactly35Grapes()
    {
        var grapes = SeedGrapeSensoryValues.GrapeValues;
        Assert.Equal(35, grapes.Count);
    }

    [Fact]
    public void SeedGrapeSensoryValues_HasUniqueNames()
    {
        var grapes = SeedGrapeSensoryValues.GrapeValues;
        var distinctNames = grapes.Select(g => g.Name.ToLowerInvariant()).Distinct().ToList();
        Assert.Equal(35, distinctNames.Count);
    }

    [Fact]
    public void SeedGrapeSensoryValues_AllValuesAreValidEnumValues()
    {
        var grapes = SeedGrapeSensoryValues.GrapeValues;

        foreach (var grape in grapes)
        {
            Assert.Contains(grape.TypicalBody, AllowedValues);
            Assert.Contains(grape.TypicalTannins, AllowedValues);
            Assert.Contains(grape.TypicalAcidity, AllowedValues);

            Assert.True(Enum.IsDefined((TypicalBody)grape.TypicalBody), $"TypicalBody {grape.TypicalBody} no es válido en el enum.");
            Assert.True(Enum.IsDefined((TypicalTannins)grape.TypicalTannins), $"TypicalTannins {grape.TypicalTannins} no es válido en el enum.");
            Assert.True(Enum.IsDefined((TypicalAcidity)grape.TypicalAcidity), $"TypicalAcidity {grape.TypicalAcidity} no es válido en el enum.");
        }
    }
}
