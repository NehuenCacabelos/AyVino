namespace AyVino.Api.Features.Sensory.Services;

public record CalculatedSensoryProfile(
    decimal? Body,
    decimal? Tannins,
    decimal? Acidity,
    decimal? Fruit,
    decimal? Oak,
    decimal? Persistence
);

public record GrapeBlendInput(int GrapeId, decimal? Percentage);
public record GrapeSensoryValues(short? Body, short? Tannins, short? Acidity);

public static class SensoryProfileCalculator
{
    public static CalculatedSensoryProfile Calculate(
        IEnumerable<GrapeBlendInput> blend,
        IReadOnlyDictionary<int, GrapeSensoryValues> typicalValuesLookup)
    {
        var list = blend.Select(b =>
        {
            typicalValuesLookup.TryGetValue(b.GrapeId, out var values);
            return (Percentage: b.Percentage, Body: values?.Body, Tannins: values?.Tannins, Acidity: values?.Acidity);
        }).ToList();

        return Calculate(list);
    }

    public static CalculatedSensoryProfile Calculate(
        IReadOnlyList<(decimal? Percentage, short? Body, short? Tannins, short? Acidity)> grapes)
    {
        if (grapes == null || grapes.Count == 0)
        {
            return new CalculatedSensoryProfile(null, null, null, null, null, null);
        }

        decimal explicitSum = 0m;
        int nullCount = 0;
        foreach (var g in grapes)
        {
            if (g.Percentage.HasValue)
            {
                explicitSum += g.Percentage.Value;
            }
            else
            {
                nullCount++;
            }
        }

        decimal remaining = Math.Max(0m, 100m - explicitSum);
        decimal weightForNull = nullCount > 0 ? (remaining / nullCount) : 0m;

        var weights = new decimal[grapes.Count];
        decimal totalWeight = 0m;
        for (int i = 0; i < grapes.Count; i++)
        {
            var w = grapes[i].Percentage ?? weightForNull;
            if (w < 0m) w = 0m;
            weights[i] = w;
            totalWeight += w;
        }

        if (totalWeight <= 0m)
        {
            for (int i = 0; i < weights.Length; i++)
            {
                weights[i] = 1m;
            }
        }

        decimal? body = CalculateAxis(grapes, weights, g => g.Body);
        decimal? tannins = CalculateAxis(grapes, weights, g => g.Tannins);
        decimal? acidity = CalculateAxis(grapes, weights, g => g.Acidity);

        return new CalculatedSensoryProfile(
            Body: body,
            Tannins: tannins,
            Acidity: acidity,
            Fruit: null,
            Oak: null,
            Persistence: null
        );
    }

    private static decimal? CalculateAxis(
        IReadOnlyList<(decimal? Percentage, short? Body, short? Tannins, short? Acidity)> grapes,
        decimal[] weights,
        Func<(decimal? Percentage, short? Body, short? Tannins, short? Acidity), short?> valueSelector)
    {
        decimal weightedSum = 0m;
        decimal validWeightSum = 0m;

        for (int i = 0; i < grapes.Count; i++)
        {
            var val = valueSelector(grapes[i]);
            if (val.HasValue)
            {
                var w = weights[i];
                weightedSum += w * val.Value;
                validWeightSum += w;
            }
        }

        if (validWeightSum <= 0m)
        {
            return null;
        }

        decimal average = weightedSum / validWeightSum;
        decimal scaled = average / 10m;
        return Math.Round(scaled, 1, MidpointRounding.AwayFromZero);
    }
}
