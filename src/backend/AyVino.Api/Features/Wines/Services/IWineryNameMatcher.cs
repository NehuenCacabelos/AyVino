namespace AyVino.Api.Features.Wines.Services;

/// <summary>
/// Provee comparación y cálculo de similitud aproximada entre nombres de bodegas
/// para el proceso de reclamo de vinos comunitarios.
/// </summary>
public interface IWineryNameMatcher
{
    /// <summary>
    /// Calcula un puntaje de similitud normalizado entre 0.0 y 1.0 entre dos nombres de bodega.
    /// </summary>
    double CalculateSimilarity(string? nameA, string? nameB);

    /// <summary>
    /// Determina si dos nombres de bodega coinciden según el umbral configurado.
    /// </summary>
    bool IsMatch(string? nameA, string? nameB, double? customThreshold = null);

    /// <summary>
    /// Normaliza un nombre de bodega removiendo diacríticos, puntuación, mayúsculas,
    /// artículos/preposiciones y términos genéricos vitivinícolas.
    /// </summary>
    string Normalize(string? name);

    /// <summary>
    /// Umbral de similitud por defecto configurado.
    /// </summary>
    double DefaultThreshold { get; }
}
