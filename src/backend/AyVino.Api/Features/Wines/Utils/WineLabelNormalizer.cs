using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using AyVino.Api.Features.Wines.Enums;

namespace AyVino.Api.Features.Wines.Utils;

public static partial class WineLabelNormalizer
{
    [GeneratedRegex(@"\s+")]
    private static partial Regex MultipleSpacesRegex();

    public static string Normalize(string? input) => NormalizeText(input);

    public static string NormalizeText(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // 1. Minúsculas invariantes
        var lower = input.ToLowerInvariant();

        // 2. Sin diacríticos (FormD y quitar NonSpacingMark)
        var formD = lower.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(formD.Length);

        foreach (var ch in formD)
        {
            var uc = CharUnicodeInfo.GetUnicodeCategory(ch);
            if (uc != UnicodeCategory.NonSpacingMark)
            {
                // 3. Todo carácter no alfanumérico cuenta como espacio
                if (char.IsLetterOrDigit(ch))
                {
                    sb.Append(ch);
                }
                else
                {
                    sb.Append(' ');
                }
            }
        }

        // 4. Espacios colapsados y recortados
        var text = MultipleSpacesRegex().Replace(sb.ToString(), " ").Trim();
        return text;
    }

    public static string BuildLabelKey(string name, string winery, WineType wineType)
    {
        var normName = NormalizeText(name);
        var normWinery = NormalizeText(winery);
        return $"{normName}|{normWinery}|{(int)wineType}";
    }

    public static string BuildLabelKey(string name, string? registeredWineryName, string? wineryNameText, int? wineryId, WineType wineType)
    {
        var winery = wineryId.HasValue ? (registeredWineryName ?? string.Empty) : (wineryNameText ?? string.Empty);
        return BuildLabelKey(name, winery, wineType);
    }
}
