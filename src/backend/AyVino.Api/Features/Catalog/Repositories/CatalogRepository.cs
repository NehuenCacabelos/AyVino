using AyVino.Api.Common.Data;
using AyVino.Api.Features.Catalog.DTOs;
using Dapper;

namespace AyVino.Api.Features.Catalog.Repositories;

public class CatalogRepository(IDbConnectionFactory connectionFactory) : ICatalogRepository
{
    private const double SimilarityThreshold = 0.3;

    public async Task<CatalogFiltersResponseDto> GetFiltersAsync(CancellationToken ct = default)
    {
        const string sql = """
            WITH visible_wines AS (
                SELECT w.id, w.winery_id, w.location_id
                FROM wines w
                LEFT JOIN wineries wy ON wy.id = w.winery_id
                WHERE w.duplicate_of_wine_id IS NULL
                  AND (wy.status IS NULL OR wy.status != 3)
                  AND (
                      EXISTS (SELECT 1 FROM wine_vintages wv WHERE wv.wine_id = w.id AND wv.approval_status != 3)
                      OR w.source_type = 1
                      OR w.winery_id IS NOT NULL
                  )
            )
            -- 1. Grapes
            SELECT g.id AS Id, g.name AS Name, COUNT(DISTINCT vw.id)::int AS WineCount
            FROM grapes g
            JOIN wine_grapes wg ON wg.grape_id = g.id
            JOIN wine_vintages wv ON wv.id = wg.wine_vintage_id AND wv.approval_status != 3
            JOIN visible_wines vw ON vw.id = wv.wine_id
            GROUP BY g.id, g.name
            ORDER BY g.name ASC;

            WITH visible_wines AS (
                SELECT w.id, w.winery_id, w.location_id
                FROM wines w
                LEFT JOIN wineries wy ON wy.id = w.winery_id
                WHERE w.duplicate_of_wine_id IS NULL
                  AND (wy.status IS NULL OR wy.status != 3)
                  AND (
                      EXISTS (SELECT 1 FROM wine_vintages wv WHERE wv.wine_id = w.id AND wv.approval_status != 3)
                      OR w.source_type = 1
                      OR w.winery_id IS NOT NULL
                  )
            )
            -- 2. Provinces
            SELECT
                COALESCE(s.id, wy_s.id) AS Id,
                COALESCE(s.name, wy_s.name) AS Name,
                COUNT(DISTINCT vw.id)::int AS WineCount
            FROM visible_wines vw
            LEFT JOIN wineries wy ON wy.id = vw.winery_id
            LEFT JOIN locations loc ON loc.id = vw.location_id
            LEFT JOIN cities c ON c.id = loc.city_id
            LEFT JOIN states s ON s.id = c.state_id
            LEFT JOIN locations wy_loc ON wy_loc.id = wy.location_id
            LEFT JOIN cities wy_c ON wy_c.id = wy_loc.city_id
            LEFT JOIN states wy_s ON wy_s.id = wy_c.state_id
            WHERE COALESCE(s.id, wy_s.id) IS NOT NULL
            GROUP BY COALESCE(s.id, wy_s.id), COALESCE(s.name, wy_s.name)
            ORDER BY Name ASC;

            WITH visible_wines AS (
                SELECT w.id, w.winery_id, w.location_id
                FROM wines w
                LEFT JOIN wineries wy ON wy.id = w.winery_id
                WHERE w.duplicate_of_wine_id IS NULL
                  AND (wy.status IS NULL OR wy.status != 3)
                  AND (
                      EXISTS (SELECT 1 FROM wine_vintages wv WHERE wv.wine_id = w.id AND wv.approval_status != 3)
                      OR w.source_type = 1
                      OR w.winery_id IS NOT NULL
                  )
            )
            -- 3. Wineries (solo registradas)
            SELECT wy.id AS Id, wy.name AS Name, COUNT(DISTINCT vw.id)::int AS WineCount
            FROM wineries wy
            JOIN visible_wines vw ON vw.winery_id = wy.id
            WHERE wy.status = 2
            GROUP BY wy.id, wy.name
            ORDER BY wy.name ASC;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        using var multi = await connection.QueryMultipleAsync(new CommandDefinition(sql, cancellationToken: ct));

        var grapes = (await multi.ReadAsync<CatalogFilterItemDto>()).ToList();
        var provinces = (await multi.ReadAsync<CatalogFilterItemDto>()).ToList();
        var wineries = (await multi.ReadAsync<CatalogFilterItemDto>()).ToList();

        return new CatalogFiltersResponseDto(grapes, provinces, wineries);
    }

    public Task<IReadOnlyList<WineSuggestionDto>> GetWineSuggestionsAsync(string searchKey, CancellationToken ct = default)
        => GetWineSuggestionsAsync(searchKey, null, null, null, ct);

    public async Task<IReadOnlyList<WineSuggestionDto>> GetWineSuggestionsAsync(
        string searchKey,
        int? grapeId,
        int? stateId,
        int? wineryId,
        CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                w.id AS Id,
                w.name AS Name,
                COALESCE(wy.name, w.winery_name_text) AS WineryName,
                latest_vintage.year AS Vintage,
                latest_vintage.image_id AS ImageId
            FROM wines w
            LEFT JOIN wineries wy ON wy.id = w.winery_id
            LEFT JOIN locations loc ON loc.id = w.location_id
            LEFT JOIN cities c ON c.id = loc.city_id
            LEFT JOIN states s ON s.id = c.state_id
            LEFT JOIN locations wy_loc ON wy_loc.id = wy.location_id
            LEFT JOIN cities wy_c ON wy_c.id = wy_loc.city_id
            LEFT JOIN states wy_s ON wy_s.id = wy_c.state_id
            LEFT JOIN LATERAL (
                SELECT wv.year, wv.image_id
                FROM wine_vintages wv
                WHERE wv.wine_id = w.id
                  AND wv.approval_status != 3
                ORDER BY
                    CASE WHEN wv.approval_status = 2 THEN 1 ELSE 0 END DESC,
                    wv.year DESC NULLS LAST,
                    wv.id DESC
                LIMIT 1
            ) latest_vintage ON TRUE
            WHERE w.duplicate_of_wine_id IS NULL
              AND (wy.status IS NULL OR wy.status != 3)
              AND (
                  EXISTS (SELECT 1 FROM wine_vintages wv_pub WHERE wv_pub.wine_id = w.id AND wv_pub.approval_status != 3)
                  OR w.source_type = 1
                  OR w.winery_id IS NOT NULL
              )
              AND (@WineryId IS NULL OR w.winery_id = @WineryId)
              AND (@StateId IS NULL OR COALESCE(s.id, wy_s.id) = @StateId)
              AND (@GrapeId IS NULL OR EXISTS (
                  SELECT 1 FROM wine_vintages wv_g
                  JOIN wine_grapes wg ON wg.wine_vintage_id = wv_g.id
                  WHERE wv_g.wine_id = w.id AND wg.grape_id = @GrapeId AND wv_g.approval_status != 3
              ))
              AND (
                  w.name_key LIKE @KeyPattern
                  OR wy.name_key LIKE @KeyPattern
                  OR w.winery_text_key LIKE @KeyPattern
                  OR similarity(w.name_key, @SearchKey) > @Threshold
                  OR similarity(COALESCE(wy.name_key, w.winery_text_key, ''), @SearchKey) > @Threshold
              )
            ORDER BY
                CASE
                    WHEN w.name_key = @SearchKey OR wy.name_key = @SearchKey OR w.winery_text_key = @SearchKey THEN 4
                    WHEN w.name_key LIKE @KeyPrefix OR wy.name_key LIKE @KeyPrefix OR w.winery_text_key LIKE @KeyPrefix THEN 3
                    WHEN w.name_key LIKE @KeyPattern OR wy.name_key LIKE @KeyPattern OR w.winery_text_key LIKE @KeyPattern THEN 2
                    WHEN similarity(w.name_key, @SearchKey) > @Threshold
                         OR similarity(COALESCE(wy.name_key, w.winery_text_key, ''), @SearchKey) > @Threshold THEN 1
                    ELSE 0
                END DESC,
                GREATEST(
                    similarity(w.name_key, @SearchKey),
                    similarity(COALESCE(wy.name_key, w.winery_text_key, ''), @SearchKey)
                ) DESC,
                w.review_count DESC,
                w.rating_sum DESC,
                w.name ASC
            LIMIT 3;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.QueryAsync<WineSuggestionDto>(
            new CommandDefinition(sql, new
            {
                SearchKey = searchKey,
                KeyPrefix = $"{searchKey}%",
                KeyPattern = $"%{searchKey}%",
                Threshold = SimilarityThreshold,
                WineryId = wineryId,
                GrapeId = grapeId,
                StateId = stateId
            }, cancellationToken: ct));

        return rows.ToList();
    }

    public Task<IReadOnlyList<WinerySuggestionDto>> GetWinerySuggestionsAsync(string searchKey, CancellationToken ct = default)
        => GetWinerySuggestionsAsync(searchKey, null, null, ct);

    public async Task<IReadOnlyList<WinerySuggestionDto>> GetWinerySuggestionsAsync(
        string searchKey,
        int? grapeId,
        int? stateId,
        CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                wy.id AS Id,
                wy.name AS Name,
                wy.logo_image_id AS LogoImageId,
                COALESCE(c.name || ', ' || s.name, s.name, 'Mendoza, Argentina') AS Location
            FROM wineries wy
            LEFT JOIN locations l ON l.id = wy.location_id
            LEFT JOIN cities c ON c.id = l.city_id
            LEFT JOIN states s ON s.id = c.state_id
            WHERE wy.status = 2
              AND EXISTS (
                  SELECT 1 FROM wines w
                  LEFT JOIN locations loc ON loc.id = w.location_id
                  LEFT JOIN cities wc ON wc.id = loc.city_id
                  LEFT JOIN states ws ON ws.id = wc.state_id
                  WHERE w.winery_id = wy.id
                    AND w.duplicate_of_wine_id IS NULL
                    AND (
                        EXISTS (SELECT 1 FROM wine_vintages wv WHERE wv.wine_id = w.id AND wv.approval_status != 3)
                        OR w.source_type = 1
                    )
                    AND (@GrapeId IS NULL OR EXISTS (
                        SELECT 1 FROM wine_vintages wv_g
                        JOIN wine_grapes wg ON wg.wine_vintage_id = wv_g.id
                        WHERE wv_g.wine_id = w.id AND wg.grape_id = @GrapeId AND wv_g.approval_status != 3
                    ))
                    AND (@StateId IS NULL OR COALESCE(ws.id, s.id) = @StateId)
              )
              AND (
                  wy.name_key LIKE @KeyPattern
                  OR similarity(wy.name_key, @SearchKey) > @Threshold
              )
            ORDER BY
                CASE
                    WHEN wy.name_key = @SearchKey THEN 4
                    WHEN wy.name_key LIKE @KeyPrefix THEN 3
                    WHEN wy.name_key LIKE @KeyPattern THEN 2
                    WHEN similarity(wy.name_key, @SearchKey) > @Threshold THEN 1
                    ELSE 0
                END DESC,
                similarity(wy.name_key, @SearchKey) DESC,
                wy.name ASC
            LIMIT 3;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.QueryAsync<WinerySuggestionDto>(
            new CommandDefinition(sql, new
            {
                SearchKey = searchKey,
                KeyPrefix = $"{searchKey}%",
                KeyPattern = $"%{searchKey}%",
                Threshold = SimilarityThreshold,
                GrapeId = grapeId,
                StateId = stateId
            }, cancellationToken: ct));

        return rows.ToList();
    }

    public async Task<IReadOnlyList<CatalogFilterItemDto>> GetAvailableGrapesAsync(
        int? wineryId = null,
        int? stateId = null,
        CancellationToken ct = default)
    {
        const string sql = """
            SELECT DISTINCT g.id AS Id, g.name AS Name, 1 AS WineCount
            FROM grapes g
            JOIN wine_grapes wg ON wg.grape_id = g.id
            JOIN wine_vintages wv ON wv.id = wg.wine_vintage_id AND wv.approval_status != 3
            JOIN wines w ON w.id = wv.wine_id
            LEFT JOIN wineries wy ON wy.id = w.winery_id
            LEFT JOIN locations loc ON loc.id = w.location_id
            LEFT JOIN cities c ON c.id = loc.city_id
            LEFT JOIN states s ON s.id = c.state_id
            LEFT JOIN locations wy_loc ON wy_loc.id = wy.location_id
            LEFT JOIN cities wy_c ON wy_c.id = wy_loc.city_id
            LEFT JOIN states wy_s ON wy_s.id = wy_c.state_id
            WHERE w.duplicate_of_wine_id IS NULL
              AND (wy.status IS NULL OR wy.status != 3)
              AND (@WineryId IS NULL OR w.winery_id = @WineryId)
              AND (@StateId IS NULL OR COALESCE(s.id, wy_s.id) = @StateId)
            ORDER BY g.name ASC;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.QueryAsync<CatalogFilterItemDto>(
            new CommandDefinition(sql, new
            {
                WineryId = wineryId,
                StateId = stateId
            }, cancellationToken: ct));

        return rows.ToList();
    }

    public async Task<IReadOnlyList<CatalogFilterItemDto>> GetAvailableProvincesAsync(
        int? wineryId = null,
        int? grapeId = null,
        CancellationToken ct = default)
    {
        const string sql = """
            SELECT DISTINCT
                COALESCE(s.id, wy_s.id) AS Id,
                COALESCE(s.name, wy_s.name) AS Name,
                1 AS WineCount
            FROM wines w
            LEFT JOIN wineries wy ON wy.id = w.winery_id
            LEFT JOIN locations loc ON loc.id = w.location_id
            LEFT JOIN cities c ON c.id = loc.city_id
            LEFT JOIN states s ON s.id = c.state_id
            LEFT JOIN locations wy_loc ON wy_loc.id = wy.location_id
            LEFT JOIN cities wy_c ON wy_c.id = wy_loc.city_id
            LEFT JOIN states wy_s ON wy_s.id = wy_c.state_id
            WHERE w.duplicate_of_wine_id IS NULL
              AND (wy.status IS NULL OR wy.status != 3)
              AND (
                  EXISTS (SELECT 1 FROM wine_vintages wv WHERE wv.wine_id = w.id AND wv.approval_status != 3)
                  OR w.source_type = 1
                  OR w.winery_id IS NOT NULL
              )
              AND COALESCE(s.id, wy_s.id) IS NOT NULL
              AND (@WineryId IS NULL OR w.winery_id = @WineryId)
              AND (@GrapeId IS NULL OR EXISTS (
                  SELECT 1 FROM wine_vintages wv_g
                  JOIN wine_grapes wg ON wg.wine_vintage_id = wv_g.id
                  WHERE wv_g.wine_id = w.id AND wg.grape_id = @GrapeId AND wv_g.approval_status != 3
              ))
            ORDER BY Name ASC;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.QueryAsync<CatalogFilterItemDto>(
            new CommandDefinition(sql, new
            {
                WineryId = wineryId,
                GrapeId = grapeId
            }, cancellationToken: ct));

        return rows.ToList();
    }
}
