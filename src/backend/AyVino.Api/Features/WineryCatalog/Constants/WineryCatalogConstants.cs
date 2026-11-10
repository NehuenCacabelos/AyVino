namespace AyVino.Api.Features.WineryCatalog.Constants;

public static class WineryCatalogConstants
{
    /// <summary>
    /// Cantidad mínima de reseñas requeridas para computar y exponer el promedio de valoración.
    /// Si un recurso (bodega, vino o cosecha) posee menos de este umbral, el promedio es null.
    /// </summary>
    public const int MinReviewsForAverage = 5;
}
