using AyVino.Api.Features.Sensory.Services;
using Xunit;

namespace AyVino.UnitTests;

public class SensoryProfileCalculatorTests
{
    [Fact]
    public void Calculate_Malbec100Percent_Returns40_40_30()
    {
        // Malbec: Body 40, Tannins 40, Acidity 30
        var grapes = new List<(decimal? Percentage, short? Body, short? Tannins, short? Acidity)>
        {
            (100m, 40, 40, 30)
        };

        var result = SensoryProfileCalculator.Calculate(grapes);

        Assert.Equal(4.0m, result.Body);
        Assert.Equal(4.0m, result.Tannins);
        Assert.Equal(3.0m, result.Acidity);
        Assert.Null(result.Fruit);
        Assert.Null(result.Oak);
        Assert.Null(result.Persistence);
    }

    [Fact]
    public void Calculate_Malbec70Percent_CabernetFranc30Percent_Returns37_37_33()
    {
        // Malbec: 40/40/30; Cabernet Franc: 30/30/40
        var grapes = new List<(decimal? Percentage, short? Body, short? Tannins, short? Acidity)>
        {
            (70m, 40, 40, 30),
            (30m, 30, 30, 40)
        };

        var result = SensoryProfileCalculator.Calculate(grapes);

        Assert.Equal(3.7m, result.Body);
        Assert.Equal(3.7m, result.Tannins);
        Assert.Equal(3.3m, result.Acidity);
    }

    [Fact]
    public void Calculate_TorrontesRiojano100Percent_Returns30_10_20()
    {
        // Torrontés Riojano: Body 30, Tannins 10, Acidity 20
        var grapes = new List<(decimal? Percentage, short? Body, short? Tannins, short? Acidity)>
        {
            (100m, 30, 10, 20)
        };

        var result = SensoryProfileCalculator.Calculate(grapes);

        Assert.Equal(3.0m, result.Body);
        Assert.Equal(1.0m, result.Tannins);
        Assert.Equal(2.0m, result.Acidity);
    }

    [Fact]
    public void Calculate_GrapeWithoutValueInAxis_IsIgnoredInThatAxis()
    {
        // Uva 1: 50%, Body 40, Tannins null, Acidity 30
        // Uva 2: 50%, Body 20, Tannins 20, Acidity 50
        var grapes = new List<(decimal? Percentage, short? Body, short? Tannins, short? Acidity)>
        {
            (50m, 40, null, 30),
            (50m, 20, 20, 50)
        };

        var result = SensoryProfileCalculator.Calculate(grapes);

        // Body: (50*40 + 50*20)/100/10 = 30/10 = 3.0
        Assert.Equal(3.0m, result.Body);
        // Tannins: sólo Uva 2 cuenta -> (50*20)/50/10 = 20/10 = 2.0
        Assert.Equal(2.0m, result.Tannins);
        // Acidity: (50*30 + 50*50)/100/10 = 40/10 = 4.0
        Assert.Equal(4.0m, result.Acidity);
    }

    [Fact]
    public void Calculate_NoGrapes_ReturnsAllNull()
    {
        var grapes = new List<(decimal? Percentage, short? Body, short? Tannins, short? Acidity)>();

        var result = SensoryProfileCalculator.Calculate(grapes);

        Assert.Null(result.Body);
        Assert.Null(result.Tannins);
        Assert.Null(result.Acidity);
        Assert.Null(result.Fruit);
        Assert.Null(result.Oak);
        Assert.Null(result.Persistence);
    }

    [Fact]
    public void Calculate_NullPercentages_DistributedEvenly()
    {
        // Uva 1: 50% explícito, Body 40
        // Uva 2: null -> recibe (100 - 50) / 2 = 25%, Body 20
        // Uva 3: null -> recibe 25%, Body 20
        var grapes = new List<(decimal? Percentage, short? Body, short? Tannins, short? Acidity)>
        {
            (50m, 40, 40, 40),
            (null, 20, 20, 20),
            (null, 20, 20, 20)
        };

        var result = SensoryProfileCalculator.Calculate(grapes);

        // Body: (50*40 + 25*20 + 25*20) / 100 / 10 = 3000 / 1000 = 3.0
        Assert.Equal(3.0m, result.Body);
        Assert.Equal(3.0m, result.Tannins);
        Assert.Equal(3.0m, result.Acidity);
    }

    [Fact]
    public void Calculate_SumOfPercentagesLessThan100_NormalizesProperly()
    {
        // Uva 1: 30%, Body 40
        // Uva 2: 20%, Body 20
        // Suma 50% explícito, sin uvas nulas
        var grapes = new List<(decimal? Percentage, short? Body, short? Tannins, short? Acidity)>
        {
            (30m, 40, 40, 40),
            (20m, 20, 20, 20)
        };

        var result = SensoryProfileCalculator.Calculate(grapes);

        // Body: (30*40 + 20*20) / (30 + 20) / 10 = (1200 + 400) / 50 / 10 = 1600 / 500 = 3.2
        Assert.Equal(3.2m, result.Body);
    }

    [Fact]
    public void Calculate_RoundingAwayFromZero_RoundsCorrectly()
    {
        // Caso que da x.x5:
        // Uva 1: 50%, Body 35
        // Uva 2: 50%, Body 40
        // Promedio = 37.5 -> / 10 = 3.75 -> AwayFromZero da 3.8
        var grapes = new List<(decimal? Percentage, short? Body, short? Tannins, short? Acidity)>
        {
            (50m, 35, 30, 30),
            (50m, 40, 30, 30)
        };

        var result = SensoryProfileCalculator.Calculate(grapes);

        Assert.Equal(3.8m, result.Body);
    }

    [Fact]
    public void Calculate_AllGrapesWeightZero_TreatsAllEqually()
    {
        var grapes = new List<(decimal? Percentage, short? Body, short? Tannins, short? Acidity)>
        {
            (0m, 40, 40, 40),
            (0m, 20, 20, 20)
        };

        var result = SensoryProfileCalculator.Calculate(grapes);

        // Al ser peso total 0, todas pesan 1: (40 + 20) / 2 / 10 = 3.0
        Assert.Equal(3.0m, result.Body);
        Assert.Equal(3.0m, result.Tannins);
        Assert.Equal(3.0m, result.Acidity);
    }
}
