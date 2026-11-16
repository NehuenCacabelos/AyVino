using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using AyVino.Api.Features.Wines.Enums;

namespace AyVino.Api.Features.Wines;

public static partial class WineLabelNormalizer
{
    public static string Normalize(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return string.Empty;

        // 1. Minúsculas invariant
        var text = raw.Trim().ToLowerInvariant();

        // 2. 'ñ' a 'n'
        text = text.Replace("ñ", "n");

        // 3. Sin acentos (descomposición FormD + filtrar NonSpacingMark)
        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();

        foreach (var c in normalizedString)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        text = sb.ToString().Normalize(NormalizationForm.FormC);

        // Por si alguna tilde quedó descompuesta sobre 'n'
        text = text.Replace("ñ", "n");

        // 4. Sin puntuación (reemplazar puntuación/símbolos por espacio)
        var cleanedChars = new StringBuilder();
        foreach (var c in text)
        {
            if (char.IsLetterOrDigit(c) || char.IsWhiteSpace(c))
            {
                cleanedChars.Append(c);
            }
            else
            {
                cleanedChars.Append(' ');
            }
        }

        // 5. Espacios colapsados y trim
        return CollapseSpacesRegex().Replace(cleanedChars.ToString(), " ").Trim();
    }

    public static string ToSearchKey(string? raw)
    {
        var normalized = Normalize(raw);
        if (string.IsNullOrEmpty(normalized))
            return string.Empty;

        return normalized.Replace(" ", "");
    }

    public static (string NameKey, string? WineryTextKey) ComputeWineKeys(string name, string? wineryNameText) =>
        (ToSearchKey(name), string.IsNullOrWhiteSpace(wineryNameText) ? null : ToSearchKey(wineryNameText));

    public static string ComputeWineryKey(string name) => ToSearchKey(name);

    public static double TrigramSimilarity(string? text1, string? text2)
    {
        var key1 = ToSearchKey(text1);
        var key2 = ToSearchKey(text2);

        if (string.IsNullOrEmpty(key1) || string.IsNullOrEmpty(key2))
            return 0.0;

        if (key1 == key2)
            return 1.0;

        var trg1 = GetTrigrams(key1);
        var trg2 = GetTrigrams(key2);

        var union = new HashSet<string>(trg1);
        union.UnionWith(trg2);

        if (union.Count == 0)
            return 0.0;

        var intersectionCount = trg1.Count(trg2.Contains);
        return (double)intersectionCount / union.Count;
    }

    private static List<string> GetTrigrams(string text)
    {
        var padded = $"  {text} ";
        var list = new List<string>(padded.Length - 2);
        for (var i = 0; i <= padded.Length - 3; i++)
        {
            list.Add(padded.Substring(i, 3));
        }
        return list;
    }

    public static long ComputeAdvisoryLockKey(int wineryId, string normalizedName, WineType wineType)
    {
        var rawKey = $"{wineryId}:{normalizedName}:{(int)wineType}";
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawKey));
        return BitConverter.ToInt64(hashBytes, 0);
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex CollapseSpacesRegex();
}
