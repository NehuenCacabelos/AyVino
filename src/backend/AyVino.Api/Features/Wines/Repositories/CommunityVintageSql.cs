namespace AyVino.Api.Features.Wines.Repositories;

/// <summary>
/// Fragmentos SQL unificados para la definición de "usuarios de una cosecha":
/// Unión distinta de uploaded_by_user_id, ítems de cava, reseñas, fotos personales y actividades de usuario (user_activities).
/// </summary>
public static class CommunityVintageSql
{
    /// <summary>
    /// Fragmento SQL que obtiene los user_id únicos que participan de una cosecha específica ({vintageIdParam}).
    /// </summary>
    public static string UsersOfSingleVintageUnion(string vintageIdParam = "@VintageId") => $"""
        SELECT uploaded_by_user_id AS user_id FROM wine_vintages WHERE id = {vintageIdParam} AND uploaded_by_user_id IS NOT NULL
        UNION
        SELECT c.user_id FROM cellar_items ci JOIN cellars c ON c.id = ci.cellar_id WHERE ci.wine_vintage_id = {vintageIdParam}
        UNION
        SELECT user_id FROM reviews WHERE wine_vintage_id = {vintageIdParam}
        UNION
        SELECT user_id FROM user_vintage_images WHERE wine_vintage_id = {vintageIdParam}
        UNION
        SELECT user_id FROM user_activities WHERE wine_vintage_id = {vintageIdParam}
        """;

    /// <summary>
    /// Fragmento SQL que obtiene pares (vintage_id, user_id) para un conjunto de cosechas ({vintageIdsParam}).
    /// </summary>
    public static string UsersOfMultipleVintagesUnion(string vintageIdsParam = "@VintageIds") => $"""
        SELECT id AS vintage_id, uploaded_by_user_id AS user_id FROM wine_vintages WHERE id = ANY({vintageIdsParam}) AND uploaded_by_user_id IS NOT NULL
        UNION
        SELECT ci.wine_vintage_id AS vintage_id, c.user_id FROM cellar_items ci JOIN cellars c ON c.id = ci.cellar_id WHERE ci.wine_vintage_id = ANY({vintageIdsParam})
        UNION
        SELECT wine_vintage_id AS vintage_id, user_id FROM reviews WHERE wine_vintage_id = ANY({vintageIdsParam})
        UNION
        SELECT wine_vintage_id AS vintage_id, user_id FROM user_vintage_images WHERE wine_vintage_id = ANY({vintageIdsParam})
        UNION
        SELECT wine_vintage_id AS vintage_id, user_id FROM user_activities WHERE wine_vintage_id = ANY({vintageIdsParam})
        """;

    /// <summary>
    /// Subquery que calcula el conteo de usuarios únicos que participan de una cosecha ({vintageAlias}.id).
    /// </summary>
    public static string CommunityUsersCountSubquery(string vintageAlias = "wv") => $"""
        (
            SELECT COUNT(DISTINCT usr.user_id)
            FROM (
                SELECT {vintageAlias}.uploaded_by_user_id AS user_id WHERE {vintageAlias}.uploaded_by_user_id IS NOT NULL
                UNION
                SELECT c.user_id FROM cellar_items ci JOIN cellars c ON c.id = ci.cellar_id WHERE ci.wine_vintage_id = {vintageAlias}.id
                UNION
                SELECT r.user_id FROM reviews r WHERE r.wine_vintage_id = {vintageAlias}.id
                UNION
                SELECT uvi.user_id FROM user_vintage_images uvi WHERE uvi.wine_vintage_id = {vintageAlias}.id
                UNION
                SELECT ua.user_id FROM user_activities ua WHERE ua.wine_vintage_id = {vintageAlias}.id
            ) usr
        )
        """;

    /// <summary>
    /// Fragmento SQL para verificar si un usuario ({userIdParam}) es participante de una cosecha ({vintageIdParam}).
    /// </summary>
    public static string IsUserParticipantExists(string vintageIdParam = "@VintageId", string userIdParam = "@UserId") => $"""
        SELECT EXISTS (
            SELECT 1 FROM wine_vintages WHERE id = {vintageIdParam} AND uploaded_by_user_id = {userIdParam}
            UNION ALL
            SELECT 1 FROM cellar_items ci JOIN cellars c ON c.id = ci.cellar_id WHERE ci.wine_vintage_id = {vintageIdParam} AND c.user_id = {userIdParam}
            UNION ALL
            SELECT 1 FROM reviews WHERE wine_vintage_id = {vintageIdParam} AND user_id = {userIdParam}
            UNION ALL
            SELECT 1 FROM user_vintage_images WHERE wine_vintage_id = {vintageIdParam} AND user_id = {userIdParam}
            UNION ALL
            SELECT 1 FROM user_activities WHERE wine_vintage_id = {vintageIdParam} AND user_id = {userIdParam}
        );
        """;

    /// <summary>
    /// Fragmento SQL para obtener los IDs de cosecha donde un usuario ({userIdParam}) es participante.
    /// </summary>
    public static string GetParticipantVintageIdsSql(string vintageIdsParam = "@VintageIds", string userIdParam = "@UserId") => $"""
        SELECT DISTINCT vintage_id
        FROM (
            SELECT id AS vintage_id FROM wine_vintages WHERE id = ANY({vintageIdsParam}) AND uploaded_by_user_id = {userIdParam}
            UNION
            SELECT ci.wine_vintage_id AS vintage_id FROM cellar_items ci JOIN cellars c ON c.id = ci.cellar_id WHERE ci.wine_vintage_id = ANY({vintageIdsParam}) AND c.user_id = {userIdParam}
            UNION
            SELECT wine_vintage_id AS vintage_id FROM reviews WHERE wine_vintage_id = ANY({vintageIdsParam}) AND user_id = {userIdParam}
            UNION
            SELECT wine_vintage_id AS vintage_id FROM user_vintage_images WHERE wine_vintage_id = ANY({vintageIdsParam}) AND user_id = {userIdParam}
            UNION
            SELECT wine_vintage_id AS vintage_id FROM user_activities WHERE wine_vintage_id = ANY({vintageIdsParam}) AND user_id = {userIdParam}
        ) u;
        """;
}
