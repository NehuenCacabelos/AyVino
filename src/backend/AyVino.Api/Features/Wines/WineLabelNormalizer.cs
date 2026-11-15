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

    public static long ComputeAdvisoryLockKey(int wineryId, string normalizedName, WineType wineType)
    {
        var rawKey = $"{wineryId}:{normalizedName}:{(int)wineType}";
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawKey));
        return BitConverter.ToInt64(hashBytes, 0);
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex CollapseSpacesRegex();
}
