using System.Data;
using AyVino.Api.Common.Data;
using AyVino.Api.Features.Catalog.DTOs;
using AyVino.Api.Features.Catalog.Models;
using AyVino.Api.Features.Wines.Enums;
using Dapper;

namespace AyVino.Api.Features.Catalog.Repositories;

public class CatalogRepository(IDbConnectionFactory connectionFactory) : ICatalogRepository
{
    private static string NormalizeForSearch(string text)
    {
        var normalized = text.Trim().ToLowerInvariant();
        const string fromChars = "áéíóúüñ";
        const string toChars   = "aeiouun";
        var chars = normalized.ToCharArray();
        for (var i = 0; i < chars.Length; i++)
        {
            var idx = fromChars.IndexOf(chars[i]);
            if (idx >= 0) chars[i] = toChars[idx];
        }
        return new string(chars);
    }

    public async Task<(int TotalCount, IReadOnlyList<ShowcaseWineryRow> Wineries)> GetShowcaseWineriesPagedAsync(
        string? q,
        WineType? wineType,
        int? grapeId,
        int? locationId,
        int pageNumber,
        int pageSize,
        CancellationToken ct = default)
    {
        var qPattern = string.IsNullOrWhiteSpace(q) ? null : $"%{NormalizeForSearch(q)}%";
        var offset = (pageNumber - 1) * pageSize;

        const string sql = """
            WITH matching_wines AS (
                SELECT 
                    w.id AS wine_id,
                    w.winery_id,
                    w.winery_name_text,
                    COALESCE(wy.name, w.winery_name_text) AS effective_winery_name,
                    CASE WHEN w.winery_id IS NOT NULL THEN 'W_' || w.winery_id::text ELSE 'T_' || LOWER(TRIM(w.winery_name_text)) END AS winery_key,
                    wy.id AS registered_winery_id,
                    wy.logo_image_id,
                    (wy.id IS NOT NULL AND wy.status = 2) AS is_verified,
                    COALESCE(
                        NULLIF(TRIM(CONCAT_WS(', ', s_wy.name, c_wy.name)), ''),
                        NULLIF(TRIM(CONCAT_WS(', ', s_w.name, c_w.name)), '')
                    ) AS location_text
                FROM wines w
                LEFT JOIN wineries wy ON wy.id = w.winery_id
                LEFT JOIN locations l_wy ON l_wy.id = wy.location_id
                LEFT JOIN cities c_wy ON c_wy.id = l_wy.city_id
                LEFT JOIN states s_wy ON s_wy.id = c_wy.state_id
                LEFT JOIN locations l_w ON l_w.id = w.location_id
                LEFT JOIN cities c_w ON c_w.id = l_w.city_id
                LEFT JOIN states s_w ON s_w.id = c_w.state_id
                WHERE w.duplicate_of_wine_id IS NULL
                  AND (w.winery_id IS NULL OR wy.status = 2)
                  AND EXISTS (
                      SELECT 1 FROM wine_vintages wv
                      WHERE wv.wine_id = w.id
                        AND wv.approval_status = 2
                        AND (@GrapeId IS NULL OR EXISTS (
                            SELECT 1 FROM wine_grapes wg WHERE wg.wine_vintage_id = wv.id AND wg.grape_id = @GrapeId
                        ))
                  )
                  AND (@WineType IS NULL OR w.wine_type = @WineType)
                  AND (@LocationId IS NULL OR w.location_id = @LocationId OR wy.location_id = @LocationId OR c_wy.id = @LocationId OR c_w.id = @LocationId OR s_wy.id = @LocationId OR s_w.id = @LocationId)
                  AND (@QPattern IS NULL OR 
                       TRANSLATE(LOWER(w.name), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE @QPattern OR
                       TRANSLATE(LOWER(COALESCE(wy.name, w.winery_name_text)), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE @QPattern)
            ),
            grouped_wineries AS (
                SELECT 
                    winery_key,
                    registered_winery_id,
                    effective_winery_name,
                    location_text,
                    logo_image_id,
                    is_verified,
                    COUNT(*)::int AS wine_count
                FROM matching_wines
                GROUP BY winery_key, registered_winery_id, effective_winery_name, location_text, logo_image_id, is_verified
            )
            SELECT 
                (SELECT COUNT(*)::int FROM grouped_wineries) AS TotalCount,
                winery_key AS WineryKey,
                registered_winery_id AS WineryId,
                effective_winery_name AS WineryName,
                location_text AS Location,
                logo_image_id AS LogoImageId,
                is_verified AS IsVerified,
                wine_count AS WineCount
            FROM grouped_wineries
            ORDER BY is_verified DESC, effective_winery_name ASC
            OFFSET @Offset LIMIT @PageSize;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = (await connection.QueryAsync<(int TotalCount, string WineryKey, int? WineryId, string WineryName, string? Location, Guid? LogoImageId, bool IsVerified, int WineCount)>(
            new CommandDefinition(sql, new
            {
                QPattern = qPattern,
                WineType = wineType.HasValue ? (short)wineType.Value : (short?)null,
                GrapeId = grapeId,
                LocationId = locationId,
                Offset = offset,
                PageSize = pageSize
            }, cancellationToken: ct))).ToList();

        if (rows.Count == 0)
        {
            return (0, Array.Empty<ShowcaseWineryRow>());
        }

        var totalCount = rows[0].TotalCount;
        var wineries = rows.Select(r => new ShowcaseWineryRow(
            r.WineryKey,
            r.WineryId,
            r.WineryName,
            r.Location,
            r.LogoImageId,
            r.IsVerified,
            r.WineCount)).ToList();

        return (totalCount, wineries);
    }

    public async Task<IReadOnlyList<ShowcaseWineRow>> GetShowcaseWinesAsync(
        IEnumerable<string> wineryKeys,
        string? q,
        WineType? wineType,
        int? grapeId,
        int? locationId,
        int winesPerWinery,
        CancellationToken ct = default)
    {
        var keys = wineryKeys.ToArray();
        if (keys.Length == 0) return Array.Empty<ShowcaseWineRow>();

        var qPattern = string.IsNullOrWhiteSpace(q) ? null : $"%{NormalizeForSearch(q)}%";

        const string sql = """
            WITH matching_wines AS (
                SELECT 
                    w.id AS wine_id,
                    w.winery_id,
                    w.winery_name_text,
                    w.name,
                    w.description,
                    w.wine_type::int AS wine_type,
                    w.location_id,
                    w.source_type::int AS source_type,
                    w.duplicate_of_wine_id,
                    w.rating_sum,
                    w.review_count,
                    CASE WHEN w.winery_id IS NOT NULL THEN 'W_' || w.winery_id::text ELSE 'T_' || LOWER(TRIM(w.winery_name_text)) END AS winery_key
                FROM wines w
                LEFT JOIN wineries wy ON wy.id = w.winery_id
                LEFT JOIN locations l_wy ON l_wy.id = wy.location_id
                LEFT JOIN cities c_wy ON c_wy.id = l_wy.city_id
                LEFT JOIN states s_wy ON s_wy.id = c_wy.state_id
                LEFT JOIN locations l_w ON l_w.id = w.location_id
                LEFT JOIN cities c_w ON c_w.id = l_w.city_id
                LEFT JOIN states s_w ON s_w.id = c_w.state_id
                WHERE w.duplicate_of_wine_id IS NULL
                  AND (w.winery_id IS NULL OR wy.status = 2)
                  AND EXISTS (
                      SELECT 1 FROM wine_vintages wv
                      WHERE wv.wine_id = w.id
                        AND wv.approval_status = 2
                        AND (@GrapeId IS NULL OR EXISTS (
                            SELECT 1 FROM wine_grapes wg WHERE wg.wine_vintage_id = wv.id AND wg.grape_id = @GrapeId
                        ))
                  )
                  AND (@WineType IS NULL OR w.wine_type = @WineType)
                  AND (@LocationId IS NULL OR w.location_id = @LocationId OR wy.location_id = @LocationId OR c_wy.id = @LocationId OR c_w.id = @LocationId OR s_wy.id = @LocationId OR s_w.id = @LocationId)
                  AND (@QPattern IS NULL OR 
                       TRANSLATE(LOWER(w.name), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE @QPattern OR
                       TRANSLATE(LOWER(COALESCE(wy.name, w.winery_name_text)), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE @QPattern)
            ),
            ranked_wines AS (
                SELECT 
                    mw.winery_key,
                    mw.wine_id AS id,
                    mw.winery_id,
                    mw.winery_name_text,
                    mw.name,
                    mw.description,
                    mw.wine_type,
                    mw.location_id,
                    mw.source_type,
                    mw.duplicate_of_wine_id,
                    mw.rating_sum,
                    mw.review_count,
                    ref_v.thumbnail_image_id,
                    ref_v.reference_vintage_year,
                    ROW_NUMBER() OVER (
                        PARTITION BY mw.winery_key 
                        ORDER BY mw.review_count DESC, mw.name ASC, mw.wine_id ASC
                    ) AS row_num
                FROM matching_wines mw
                LEFT JOIN LATERAL (
                    SELECT ref_wv.image_id AS thumbnail_image_id, ref_wv.year AS reference_vintage_year
                    FROM wine_vintages ref_wv
                    WHERE ref_wv.wine_id = mw.wine_id
                      AND ref_wv.approval_status = 2
                    ORDER BY (CASE WHEN ref_wv.image_id IS NOT NULL THEN 0 ELSE 1 END),
                             ref_wv.year DESC NULLS LAST,
                             ref_wv.id DESC
                    LIMIT 1
                ) ref_v ON TRUE
                WHERE mw.winery_key = ANY(@WineryKeys)
            )
            SELECT 
                winery_key AS WineryKey,
                id AS Id,
                winery_id AS WineryId,
                winery_name_text AS WineryNameText,
                name AS Name,
                description AS Description,
                wine_type AS WineType,
                location_id AS LocationId,
                source_type AS SourceType,
                duplicate_of_wine_id AS DuplicateOfWineId,
                rating_sum AS RatingSum,
                review_count AS ReviewCount,
                thumbnail_image_id AS ThumbnailImageId,
                reference_vintage_year AS ReferenceVintageYear
            FROM ranked_wines
            WHERE row_num <= @WinesPerWinery
            ORDER BY winery_key, row_num;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.QueryAsync<ShowcaseWineRow>(
            new CommandDefinition(sql, new
            {
                WineryKeys = keys,
                QPattern = qPattern,
                WineType = wineType.HasValue ? (short)wineType.Value : (short?)null,
                GrapeId = grapeId,
                LocationId = locationId,
                WinesPerWinery = winesPerWinery
            }, cancellationToken: ct));

        return rows.AsList();
    }

    public async Task<CatalogFiltersResponseDto> GetCatalogFiltersAsync(CancellationToken ct = default)
    {
        const string sql = """
            -- 1. Varietales
            SELECT g.id AS Id, g.name AS Name, COUNT(DISTINCT w.id)::int AS Count
            FROM grapes g
            JOIN wine_grapes wg ON wg.grape_id = g.id
            JOIN wine_vintages wv ON wv.id = wg.wine_vintage_id
            JOIN wines w ON w.id = wv.wine_id
            LEFT JOIN wineries wy ON wy.id = w.winery_id
            WHERE wv.approval_status = 2
              AND w.duplicate_of_wine_id IS NULL
              AND (w.winery_id IS NULL OR wy.status = 2)
            GROUP BY g.id, g.name
            ORDER BY g.name ASC;

            -- 2. Regiones (Provincias)
            SELECT s.id AS Id, s.name AS Name, COUNT(DISTINCT w.id)::int AS Count
            FROM states s
            JOIN cities c ON c.state_id = s.id
            JOIN locations l ON l.city_id = c.id
            JOIN wines w ON (w.location_id = l.id OR EXISTS (SELECT 1 FROM wineries wy WHERE wy.id = w.winery_id AND wy.location_id = l.id))
            LEFT JOIN wineries wy ON wy.id = w.winery_id
            WHERE w.duplicate_of_wine_id IS NULL
              AND (w.winery_id IS NULL OR wy.status = 2)
              AND EXISTS (SELECT 1 FROM wine_vintages wv WHERE wv.wine_id = w.id AND wv.approval_status = 2)
            GROUP BY s.id, s.name
            ORDER BY s.name ASC;

            -- 3. Bodegas
            SELECT wy.id AS Id, wy.name AS Name, COUNT(DISTINCT w.id)::int AS Count
            FROM wineries wy
            JOIN wines w ON w.winery_id = wy.id
            WHERE wy.status = 2
              AND w.duplicate_of_wine_id IS NULL
              AND EXISTS (SELECT 1 FROM wine_vintages wv WHERE wv.wine_id = w.id AND wv.approval_status = 2)
            GROUP BY wy.id, wy.name
            ORDER BY wy.name ASC;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        using var multi = await connection.QueryMultipleAsync(new CommandDefinition(sql, cancellationToken: ct));

        var varietals = (await multi.ReadAsync<CatalogFilterOptionDto>()).ToList();
        var regions = (await multi.ReadAsync<CatalogFilterOptionDto>()).ToList();
        var wineries = (await multi.ReadAsync<CatalogFilterOptionDto>()).ToList();

        return new CatalogFiltersResponseDto(varietals, regions, wineries);
    }
}
