using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;

namespace AyVino.Api.Features.Wines.Services;

public partial class WineryNameMatcher : IWineryNameMatcher
{
    public const double DefaultMatchThreshold = 0.75;
    private readonly double _threshold;

    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "de", "del", "la", "las", "los", "el", "y", "e", "en", "al"
    };

    private static readonly HashSet<string> GenericWineryTerms = new(StringComparer.OrdinalIgnoreCase)
    {
        "bodega", "bodegas",
        "finca", "fincas",
        "vinedo", "vinedos", "viniedo", "viniedos",
        "vina", "vinas", "vinia", "vinias",
        "wine", "wines",
        "champanera", "estancia"
    };

    [GeneratedRegex(@"\s+")]
    private static partial Regex MultipleSpacesRegex();

    public WineryNameMatcher(IConfiguration? configuration = null)
    {
        if (configuration != null && double.TryParse(configuration["WineryMatching:Threshold"], NumberStyles.Float, CultureInfo.InvariantCulture, out var t))
        {
            _threshold = t;
        }
        else
        {
            _threshold = DefaultMatchThreshold;
        }
    }

    public double DefaultThreshold => _threshold;

    public string Normalize(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return string.Empty;

        // 1. Minúsculas invariantes
        var lower = name.ToLowerInvariant();

        // 2. Sin diacríticos (FormD y quitar NonSpacingMark) -> 'ñ' -> 'n', 'á' -> 'a', etc.
        var formD = lower.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(formD.Length);

        foreach (var ch in formD)
        {
            var uc = CharUnicodeInfo.GetUnicodeCategory(ch);
            if (uc != UnicodeCategory.NonSpacingMark)
            {
                if (char.IsLetterOrDigit(ch))
                    sb.Append(ch);
                else
                    sb.Append(' ');
            }
        }

        var cleaned = MultipleSpacesRegex().Replace(sb.ToString(), " ").Trim();
        if (string.IsNullOrWhiteSpace(cleaned))
            return string.Empty;

        // 3. Quitar artículos, preposiciones y términos genéricos de bodega
        var tokens = cleaned.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var filteredTokens = tokens
            .Where(t => !StopWords.Contains(t) && !GenericWineryTerms.Contains(t))
            .ToList();

        // Si todos los tokens eran stopwords o términos genéricos, conservamos los tokens limpios sin stopwords
        if (filteredTokens.Count == 0)
        {
            filteredTokens = tokens.Where(t => !StopWords.Contains(t)).ToList();
        }

        // Si aún así queda vacío, devolvemos los tokens originales
        if (filteredTokens.Count == 0)
        {
            filteredTokens = tokens.ToList();
        }

        return string.Join(" ", filteredTokens);
    }

    public double CalculateSimilarity(string? nameA, string? nameB)
    {
        var normA = Normalize(nameA);
        var normB = Normalize(nameB);

        if (string.IsNullOrEmpty(normA) && string.IsNullOrEmpty(normB))
            return 1.0;

        if (string.IsNullOrEmpty(normA) || string.IsNullOrEmpty(normB))
            return 0.0;

        if (string.Equals(normA, normB, StringComparison.Ordinal))
            return 1.0;

        var distance = ComputeLevenshteinDistance(normA, normB);
        var maxLen = Math.Max(normA.Length, normB.Length);

        if (maxLen == 0)
            return 1.0;

        var similarity = 1.0 - ((double)distance / maxLen);
        return Math.Round(Math.Clamp(similarity, 0.0, 1.0), 4);
    }

    public bool IsMatch(string? nameA, string? nameB, double? customThreshold = null)
    {
        var threshold = customThreshold ?? _threshold;
        return CalculateSimilarity(nameA, nameB) >= threshold;
    }

    public static int ComputeLevenshteinDistance(string s, string t)
    {
        if (s == t) return 0;
        if (string.IsNullOrEmpty(s)) return t.Length;
        if (string.IsNullOrEmpty(t)) return s.Length;

        var d = new int[t.Length + 1];
        for (var j = 0; j <= t.Length; j++)
            d[j] = j;

        for (var i = 0; i < s.Length; i++)
        {
            var prev = i + 1;
            for (var j = 0; j < t.Length; j++)
            {
                var cost = s[i] == t[j] ? 0 : 1;
                var current = Math.Min(Math.Min(d[j + 1] + 1, prev + 1), d[j] + cost);
                d[j] = prev;
                prev = current;
            }
            d[t.Length] = prev;
        }

        return d[t.Length];
    }
}
