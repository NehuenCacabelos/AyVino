using System;
using System.Linq;
using AyVino.Api.Features.Pairings.Enums;
using AyVino.Api.Migrations;
using Xunit;

namespace AyVino.UnitTests.Migrations;

public class SeedPairingsTests
{
    [Fact]
    public void SeedPairings_ShouldContainExactly24Items()
    {
        Assert.Equal(24, SeedPairings.Pairings.Length);
    }

    [Fact]
    public void SeedPairings_AllNamesShouldBeUnique()
    {
        var names = SeedPairings.Pairings.Select(p => p.Name).ToList();
        var distinctNames = names.Distinct(StringComparer.OrdinalIgnoreCase).ToList();

        Assert.Equal(names.Count, distinctNames.Count);
    }

    [Fact]
    public void SeedPairings_AllCategoriesShouldBeValidEnumValues()
    {
        foreach (var (name, category) in SeedPairings.Pairings)
        {
            Assert.True(Enum.IsDefined(typeof(PairingCategory), (PairingCategory)category),
                $"El maridaje '{name}' tiene una categoría inválida: {category}");
        }
    }

    [Fact]
    public void SeedPairings_ShouldMatchExpectedCategoryDistribution()
    {
        var meatCount = SeedPairings.Pairings.Count(p => p.Category == (short)PairingCategory.Meat);
        var fishCount = SeedPairings.Pairings.Count(p => p.Category == (short)PairingCategory.Fish);
        var seafoodCount = SeedPairings.Pairings.Count(p => p.Category == (short)PairingCategory.Seafood);
        var pastaCount = SeedPairings.Pairings.Count(p => p.Category == (short)PairingCategory.Pasta);
        var vegCount = SeedPairings.Pairings.Count(p => p.Category == (short)PairingCategory.Vegetarian);
        var cheeseCount = SeedPairings.Pairings.Count(p => p.Category == (short)PairingCategory.Cheese);
        var otherCount = SeedPairings.Pairings.Count(p => p.Category == (short)PairingCategory.Other);
        var dessertCount = SeedPairings.Pairings.Count(p => p.Category == (short)PairingCategory.Dessert);
        var appetizerCount = SeedPairings.Pairings.Count(p => p.Category == (short)PairingCategory.Appetizer);

        Assert.Equal(13, meatCount);
        Assert.Equal(4, fishCount);
        Assert.Equal(1, seafoodCount);
        Assert.Equal(2, pastaCount);
        Assert.Equal(1, vegCount);
        Assert.Equal(1, cheeseCount);
        Assert.Equal(2, otherCount);
        Assert.Equal(0, dessertCount);
        Assert.Equal(0, appetizerCount);
    }
}
