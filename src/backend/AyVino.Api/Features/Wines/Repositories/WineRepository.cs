using AyVino.Api.Common.Data;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using Dapper;

namespace AyVino.Api.Features.Wines.Repositories;

public class WineRepository(IDbConnectionFactory connectionFactory) : IWineRepository
{
    private const string SelectColumns = """
        id, winery_id, winery_name_text, name, description, wine_type, location_id,
        source_type, duplicate_of_wine_id, rating_sum, review_count
        """;

    public async Task<Wine?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var sql = $"SELECT {SelectColumns} FROM wines WHERE id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Wine>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<Wine?> GetVisibleByIdAsync(int id, int? currentUserId, bool isAdmin, CancellationToken ct = default)
    {
        const string sql = """
            SELECT w.id, w.winery_id, w.winery_name_text, w.name, w.description, w.wine_type,
                   w.location_id, w.source_type, w.duplicate_of_wine_id, w.rating_sum, w.review_count
            FROM wines w
            LEFT JOIN wineries wy ON wy.id = w.winery_id
            WHERE w.id = @Id
              AND (@IsAdmin = TRUE OR w.duplicate_of_wine_id IS NULL)
              AND (
                @IsAdmin = TRUE
                OR (@CurrentUserId IS NOT NULL AND wy.user_id = @CurrentUserId)
                OR (w.winery_id IS NULL OR wy.status = 2)
              );
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Wine>(
            new CommandDefinition(sql, new { Id = id, CurrentUserId = currentUserId, IsAdmin = isAdmin }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Wine>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken ct = default)
    {
        var idList = ids as IReadOnlyCollection<int> ?? ids.ToArray();
        if (idList.Count == 0)
        {
            return [];
        }

        var sql = $"SELECT {SelectColumns} FROM wines WHERE id = ANY(@Ids) ORDER BY id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<Wine>(
            new CommandDefinition(sql, new { Ids = idList.ToArray() }, cancellationToken: ct));
    }

    public Task<IEnumerable<Wine>> GetAllAsync(int pageNumber, int pageSize, int? wineryId = null, int? grapeId = null, int? yearFrom = null, int? yearTo = null, CancellationToken ct = default) =>
        GetAllAsync(pageNumber, pageSize, wineryId, grapeId, yearFrom, yearTo, null, false, ct);

    public async Task<IEnumerable<Wine>> GetAllAsync(int pageNumber, int pageSize, int? wineryId, int? grapeId, int? yearFrom, int? yearTo, int? currentUserId, bool isAdmin, CancellationToken ct = default)
    {
        const string sql = """
            SELECT w.id, w.winery_id, w.winery_name_text, w.name, w.description, w.wine_type,
                   w.location_id, w.source_type, w.duplicate_of_wine_id, w.rating_sum, w.review_count
            FROM wines w
            LEFT JOIN wineries wy ON wy.id = w.winery_id
            WHERE (@WineryId IS NULL OR w.winery_id = @WineryId)
              AND (@IsAdmin = TRUE OR w.duplicate_of_wine_id IS NULL)
              AND (
                @IsAdmin = TRUE
                OR (@CurrentUserId IS NOT NULL AND wy.user_id = @CurrentUserId)
                OR (w.winery_id IS NULL OR wy.status = 2)
              )
              AND (
                @IsAdmin = TRUE
                OR (@CurrentUserId IS NOT NULL AND wy.user_id = @CurrentUserId)
                OR EXISTS (SELECT 1 FROM wine_vintages wv_pub WHERE wv_pub.wine_id = w.id AND wv_pub.approval_status = 2)
              )
              AND (@GrapeId IS NULL OR EXISTS (
                    SELECT 1 FROM wine_vintages wv
                    JOIN wine_grapes wg ON wg.wine_vintage_id = wv.id
                    WHERE wv.wine_id = w.id AND wg.grape_id = @GrapeId
                      AND (@IsAdmin = TRUE
                           OR (@CurrentUserId IS NOT NULL AND (wy.user_id = @CurrentUserId OR wv.uploaded_by_user_id = @CurrentUserId))
                           OR wv.approval_status = 2)))
              AND (
                    (@YearFrom IS NULL AND @YearTo IS NULL) OR EXISTS (
                        SELECT 1 FROM wine_vintages wv2
                        WHERE wv2.wine_id = w.id
                          AND (@YearFrom IS NULL OR wv2.year >= @YearFrom)
                          AND (@YearTo IS NULL OR wv2.year <= @YearTo)
                          AND (@IsAdmin = TRUE
                               OR (@CurrentUserId IS NOT NULL AND (wy.user_id = @CurrentUserId OR wv2.uploaded_by_user_id = @CurrentUserId))
                               OR wv2.approval_status = 2)
                    )
                  )
            ORDER BY w.id
            OFFSET @Offset LIMIT @PageSize;
            """;
        var offset = (pageNumber - 1) * pageSize;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<Wine>(
            new CommandDefinition(sql, new
            {
                WineryId = wineryId,
                GrapeId = grapeId,
                YearFrom = yearFrom,
                YearTo = yearTo,
                CurrentUserId = currentUserId,
                IsAdmin = isAdmin,
                Offset = offset,
                PageSize = pageSize
            }, cancellationToken: ct));
    }

    public async Task<Wine> CreateWithFirstVintageAsync(Wine wine, WineVintage firstVintage, IEnumerable<WineGrape> grapes, CancellationToken ct = default)
    {
        const string insertWineSql = """
            INSERT INTO wines (winery_id, winery_name_text, name, description, wine_type, location_id, source_type, rating_sum, review_count)
            VALUES (@WineryId, @WineryNameText, @Name, @Description, @WineType, @LocationId, @SourceType, 0, 0)
            RETURNING id;
            """;
        const string insertVintageSql = """
            INSERT INTO wine_vintages (wine_id, year, alcohol_content, serving_temperature, aging_advice, image_id, approval_status, uploaded_by_user_id, register_date, rating_sum, review_count)
            VALUES (@WineId, @Year, @AlcoholContent, @ServingTemperature, @AgingAdvice, @ImageId, @ApprovalStatus, @UploadedByUserId, @RegisterDate, 0, 0)
            RETURNING id;
            """;
        const string insertGrapeSql = """
            INSERT INTO wine_grapes (wine_vintage_id, grape_id, percentage)
            VALUES (@WineVintageId, @GrapeId, @Percentage);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        if (wine.WineryId.HasValue)
        {
            var normalizedName = WineLabelNormalizer.Normalize(wine.Name);
            var lockKey = WineLabelNormalizer.ComputeAdvisoryLockKey(wine.WineryId.Value, normalizedName, wine.WineType);

            await connection.ExecuteAsync(
                new CommandDefinition("SELECT pg_advisory_xact_lock(@LockKey);", new { LockKey = lockKey }, transaction: transaction, cancellationToken: ct));

            const string findWinesSql = """
                SELECT id, winery_id, winery_name_text, name, description, wine_type, location_id,
                       source_type, duplicate_of_wine_id, rating_sum, review_count
                FROM wines
                WHERE winery_id = @WineryId
                  AND wine_type = @WineType
                  AND duplicate_of_wine_id IS NULL;
                """;

            var candidates = (await connection.QueryAsync<Wine>(
                new CommandDefinition(findWinesSql, new { WineryId = wine.WineryId.Value, WineType = (int)wine.WineType }, transaction: transaction, cancellationToken: ct))).ToList();

            var existingWine = candidates.FirstOrDefault(c => WineLabelNormalizer.Normalize(c.Name) == normalizedName);
            if (existingWine != null)
            {
                const string findVintagesSql = """
                    SELECT id, wine_id, year, approval_status
                    FROM wine_vintages
                    WHERE wine_id = @WineId;
                    """;

                var vintages = (await connection.QueryAsync<WineVintage>(
                    new CommandDefinition(findVintagesSql, new { WineId = existingWine.Id }, transaction: transaction, cancellationToken: ct))).ToList();

                var existingVintage = firstVintage.Year.HasValue
                    ? vintages.FirstOrDefault(v => v.Year == firstVintage.Year)
                    : null;

                if (existingVintage != null)
                {
                    throw new ConflictException(
                        $"Ya existe el vino '{existingWine.Name}' con la cosecha {firstVintage.Year} en esta bodega.",
                        new Dictionary<string, object?>
                        {
                            ["code"] = "WINE_VINTAGE_DUPLICATE",
                            ["existingWineId"] = existingWine.Id,
                            ["existingVintageId"] = existingVintage.Id
                        });
                }

                throw new ConflictException(
                    $"Ya existe el vino '{existingWine.Name}' en esta bodega. Podés agregarle una nueva cosecha.",
                    new Dictionary<string, object?>
                    {
                        ["code"] = "WINE_EXISTS_ADD_VINTAGE",
                        ["existingWineId"] = existingWine.Id
                    });
            }
        }

        var wineId = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(insertWineSql, new
            {
                wine.WineryId,
                wine.WineryNameText,
                wine.Name,
                wine.Description,
                WineType = (int)wine.WineType,
                wine.LocationId,
                SourceType = (int)wine.SourceType
            }, transaction: transaction, cancellationToken: ct));

        var vintageId = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(insertVintageSql, new
            {
                WineId = wineId,
                firstVintage.Year,
                firstVintage.AlcoholContent,
                firstVintage.ServingTemperature,
                firstVintage.AgingAdvice,
                firstVintage.ImageId,
                ApprovalStatus = (int)firstVintage.ApprovalStatus,
                firstVintage.UploadedByUserId,
                firstVintage.RegisterDate
            }, transaction: transaction, cancellationToken: ct));

        foreach (var grape in grapes)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(insertGrapeSql, new
                {
                    WineVintageId = vintageId,
                    grape.GrapeId,
                    grape.Percentage
                }, transaction: transaction, cancellationToken: ct));
        }

        await transaction.CommitAsync(ct);
        return wine with { Id = wineId };
    }

    public async Task<bool> UpdateAsync(Wine wine, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE wines
            SET winery_id = @WineryId,
                winery_name_text = @WineryNameText,
                name = @Name,
                description = @Description,
                wine_type = @WineType,
                location_id = @LocationId,
                source_type = @SourceType
            WHERE id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.ExecuteAsync(
            new CommandDefinition(sql, new
            {
                wine.Id,
                wine.WineryId,
                wine.WineryNameText,
                wine.Name,
                wine.Description,
                WineType = (int)wine.WineType,
                wine.LocationId,
                SourceType = (int)wine.SourceType
            }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM wines WHERE id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = "SELECT 1 FROM wines WHERE id = @Id LIMIT 1;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<WineUsageCounts> GetUsageCountsAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                (SELECT COUNT(*) FROM wines WHERE duplicate_of_wine_id = @Id) AS DuplicateWinesCount,
                (SELECT COUNT(*) FROM reviews r JOIN wine_vintages wv ON wv.id = r.wine_vintage_id WHERE wv.wine_id = @Id) AS ReviewCount,
                (SELECT COUNT(*) FROM user_wines WHERE wine_id = @Id) AS UserWineCount,
                (SELECT COUNT(*) FROM cellar_items ci JOIN wine_vintages wv ON wv.id = ci.wine_vintage_id WHERE wv.wine_id = @Id) AS CellarItemCount;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleAsync<WineUsageCounts>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Wine>> GetUnclaimedByNameLikeAsync(string nameFragment, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, winery_id, winery_name_text, name, description, wine_type,
                   location_id, source_type, duplicate_of_wine_id, rating_sum, review_count
            FROM wines
            WHERE winery_id IS NULL
              AND duplicate_of_wine_id IS NULL
              AND winery_name_text ILIKE @Pattern
            ORDER BY id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<Wine>(
            new CommandDefinition(sql, new { Pattern = $"%{nameFragment}%" }, cancellationToken: ct));
    }

    public async Task<int> ClaimWinesAsync(int wineryId, IEnumerable<int> wineIds, CancellationToken ct = default)
    {
        var wineIdsArray = wineIds as int[] ?? wineIds.ToArray();
        if (wineIdsArray.Length == 0) return 0;

        const string updateWinesSql = """
            UPDATE wines
            SET winery_id = @WineryId,
                source_type = @SourceType
            WHERE id = ANY(@WineIds)
              AND winery_id IS NULL
            RETURNING id;
            """;

        const string updateVintagesSql = """
            UPDATE wine_vintages
            SET approval_status = @ApprovedStatus
            WHERE wine_id = ANY(@ClaimedWineIds)
              AND approval_status = @PendingStatus;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        var claimedWineIds = (await connection.QueryAsync<int>(
            new CommandDefinition(updateWinesSql, new
            {
                WineryId = wineryId,
                SourceType = (int)SourceType.Official,
                WineIds = wineIdsArray
            }, transaction: transaction, cancellationToken: ct))).ToList();

        if (claimedWineIds.Count > 0)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(updateVintagesSql, new
                {
                    ClaimedWineIds = claimedWineIds.ToArray(),
                    ApprovedStatus = (int)ApprovalStatus.Approved,
                    PendingStatus = (int)ApprovalStatus.Pending
                }, transaction: transaction, cancellationToken: ct));
        }

        await transaction.CommitAsync(ct);
        return claimedWineIds.Count;
    }

    public async Task<Wine?> FindDuplicateCandidateAsync(string name, string winery, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(winery))
            return null;

        const string sql = """
            SELECT w.id, w.winery_id, w.winery_name_text, w.name, w.description, w.wine_type,
                   w.location_id, w.source_type, w.duplicate_of_wine_id, w.rating_sum, w.review_count
            FROM wines w
            LEFT JOIN wineries wy ON wy.id = w.winery_id
            WHERE w.duplicate_of_wine_id IS NULL
              AND (
                  LOWER(TRIM(w.name)) = LOWER(TRIM(@Name))
                  OR similarity(w.name, @Name) > 0.35
              )
              AND (
                  LOWER(TRIM(COALESCE(w.winery_name_text, ''))) = LOWER(TRIM(@Winery))
                  OR LOWER(TRIM(COALESCE(wy.name, ''))) = LOWER(TRIM(@Winery))
                  OR similarity(COALESCE(w.winery_name_text, ''), @Winery) > 0.35
                  OR similarity(COALESCE(wy.name, ''), @Winery) > 0.35
              )
            ORDER BY
                (GREATEST(
                    similarity(w.name, @Name),
                    CASE WHEN LOWER(TRIM(w.name)) = LOWER(TRIM(@Name)) THEN 1.0 ELSE 0.0 END
                ) +
                GREATEST(
                    similarity(COALESCE(w.winery_name_text, ''), @Winery),
                    similarity(COALESCE(wy.name, ''), @Winery),
                    CASE WHEN LOWER(TRIM(COALESCE(w.winery_name_text, ''))) = LOWER(TRIM(@Winery)) OR LOWER(TRIM(COALESCE(wy.name, ''))) = LOWER(TRIM(@Winery)) THEN 1.0 ELSE 0.0 END
                )) DESC
            LIMIT 1;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Wine>(
            new CommandDefinition(sql, new { Name = name.Trim(), Winery = winery.Trim() }, cancellationToken: ct));
    }

    // Umbral de similitud por trigramas: 0 a 1, cuanto más alto más estricto.
    // 0.25 tolera errores de tipeo normales (letras de más/de menos, mayúsculas) sin devolver basura.
    private const double SimilarityThreshold = 0.25;
    public Task<IEnumerable<Wine>> SearchAsync(string? name, string? winery, int? year, WineType? wineType, int pageNumber, int pageSize, CancellationToken ct = default) =>
        SearchAsync(name, winery, year, wineType, pageNumber, pageSize, null, false, ct);

    public async Task<IEnumerable<Wine>> SearchAsync(string? name, string? winery, int? year, WineType? wineType, int pageNumber, int pageSize, int? currentUserId, bool isAdmin, CancellationToken ct = default)
    {
        var hasSearchTerm = !string.IsNullOrWhiteSpace(name) || !string.IsNullOrWhiteSpace(winery);

        const string sql = """
            SELECT w.id, w.winery_id, w.winery_name_text, w.name, w.description, w.wine_type,
                w.location_id, w.source_type, w.duplicate_of_wine_id, w.rating_sum, w.review_count
            FROM wines w
            LEFT JOIN wineries wy ON wy.id = w.winery_id
            WHERE (@IsAdmin = TRUE OR w.duplicate_of_wine_id IS NULL)
              AND (
                @IsAdmin = TRUE
                OR (@CurrentUserId IS NOT NULL AND wy.user_id = @CurrentUserId)
                OR (w.winery_id IS NULL OR wy.status = 2)
            )
            AND (
                @IsAdmin = TRUE
                OR (@CurrentUserId IS NOT NULL AND wy.user_id = @CurrentUserId)
                OR EXISTS (SELECT 1 FROM wine_vintages wv_pub WHERE wv_pub.wine_id = w.id AND wv_pub.approval_status = 2)
                OR (@HasSearchTerm = TRUE AND w.source_type = 1 AND EXISTS (SELECT 1 FROM wine_vintages wv_comm WHERE wv_comm.wine_id = w.id))
            )
            AND (@Name IS NULL
                OR w.name ILIKE @NamePattern
                OR similarity(w.name, @Name) > @Threshold)
            AND (@Winery IS NULL
                OR w.winery_name_text ILIKE @WineryPattern
                OR wy.name ILIKE @WineryPattern
                OR similarity(COALESCE(w.winery_name_text, ''), @Winery) > @Threshold
                OR similarity(COALESCE(wy.name, ''), @Winery) > @Threshold)
            AND (@WineType IS NULL OR w.wine_type = @WineType)
            AND (@Year IS NULL OR EXISTS (
                    SELECT 1 FROM wine_vintages wv WHERE wv.wine_id = w.id AND wv.year = @Year
                    AND (@IsAdmin = TRUE
                         OR (@CurrentUserId IS NOT NULL AND (wy.user_id = @CurrentUserId OR wv.uploaded_by_user_id = @CurrentUserId))
                         OR wv.approval_status = 2
                         OR (@HasSearchTerm = TRUE AND w.source_type = 1))
                ))
            ORDER BY
            GREATEST(
                CASE WHEN @Name IS NULL THEN 0 ELSE similarity(w.name, @Name) END,
                CASE WHEN @Winery IS NULL THEN 0 ELSE GREATEST(
                    similarity(COALESCE(w.winery_name_text, ''), @Winery),
                    similarity(COALESCE(wy.name, ''), @Winery)
                ) END
            ) DESC,
            w.id
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<Wine>(
            new CommandDefinition(sql, new
            {
                Name = name,
                NamePattern = name is null ? null : $"%{name}%",
                Winery = winery,
                WineryPattern = winery is null ? null : $"%{winery}%",
                Threshold = SimilarityThreshold,
                WineType = wineType.HasValue ? (int)wineType.Value : (int?)null,
                Year = year,
                CurrentUserId = currentUserId,
                IsAdmin = isAdmin,
                HasSearchTerm = hasSearchTerm,
                Offset = (pageNumber - 1) * pageSize,
                PageSize = pageSize
            }, cancellationToken: ct));
    }

    public async Task<IEnumerable<CatalogWineItemDto>> SearchCatalogAsync(
        string? search,
        string? name,
        string? winery,
        int? year,
        WineType? wineType,
        int pageNumber,
        int pageSize,
        int? currentUserId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var cleanSearch = string.IsNullOrWhiteSpace(search) ? null : search.Trim();
        var cleanName = string.IsNullOrWhiteSpace(name) ? null : name.Trim();
        var cleanWinery = string.IsNullOrWhiteSpace(winery) ? null : winery.Trim();
        var hasSearchTerm = cleanSearch is not null || cleanName is not null || cleanWinery is not null;

        const string sql = """
            SELECT
                w.id AS Id,
                w.winery_id AS WineryId,
                w.winery_name_text AS WineryNameText,
                COALESCE(wy.name, w.winery_name_text) AS WineryName,
                w.name AS Name,
                w.description AS Description,
                CASE w.wine_type
                    WHEN 1 THEN 'Red'
                    WHEN 2 THEN 'White'
                    WHEN 3 THEN 'Rose'
                    WHEN 4 THEN 'Sparkling'
                    WHEN 5 THEN 'Orange'
                    ELSE 'Red'
                END AS WineType,
                w.location_id AS LocationId,
                COALESCE(c.name || ', ' || s.name, s.name, wy_c.name || ', ' || wy_s.name, wy_s.name, 'Mendoza, Argentina') AS RegionName,
                COALESCE(main_grape.grape_name, CASE w.wine_type
                    WHEN 1 THEN 'Tinto'
                    WHEN 2 THEN 'Blanco'
                    WHEN 3 THEN 'Rosado'
                    WHEN 4 THEN 'Espumoso'
                    WHEN 5 THEN 'Naranjo'
                    ELSE 'Tinto'
                END) AS Varietal,
                latest_vintage.year AS Vintage,
                latest_vintage.image_id AS ImageId,
                CASE WHEN latest_vintage.image_id IS NOT NULL THEN '/api/images/' || latest_vintage.image_id || '?variant=bottle' ELSE NULL END AS ImageUrl,
                CASE w.source_type
                    WHEN 1 THEN 'Community'
                    WHEN 2 THEN 'Official'
                    ELSE 'Community'
                END AS SourceType,
                w.duplicate_of_wine_id AS DuplicateOfWineId,
                CASE
                    WHEN w.review_count >= 5 THEN ROUND((w.rating_sum::numeric / w.review_count), 2)
                    WHEN w.review_count > 0 THEN ROUND((w.rating_sum::numeric / w.review_count), 1)
                    ELSE NULL
                END AS AverageRating,
                w.review_count AS ReviewCount
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
                  AND (@IsAdmin = TRUE
                       OR (@CurrentUserId IS NOT NULL AND (wy.user_id = @CurrentUserId OR wv.uploaded_by_user_id = @CurrentUserId))
                       OR wv.approval_status != 3)
                ORDER BY
                    CASE WHEN wv.approval_status = 2 THEN 1 ELSE 0 END DESC,
                    wv.year DESC NULLS LAST,
                    wv.id DESC
                LIMIT 1
            ) latest_vintage ON TRUE
            LEFT JOIN LATERAL (
                SELECT g.name AS grape_name
                FROM wine_grapes wg
                INNER JOIN grapes g ON g.id = wg.grape_id
                WHERE wg.wine_vintage_id = (
                    SELECT wv2.id
                    FROM wine_vintages wv2
                    WHERE wv2.wine_id = w.id
                      AND (@IsAdmin = TRUE
                           OR (@CurrentUserId IS NOT NULL AND (wy.user_id = @CurrentUserId OR wv2.uploaded_by_user_id = @CurrentUserId))
                           OR wv2.approval_status != 3)
                    ORDER BY
                        CASE WHEN wv2.approval_status = 2 THEN 1 ELSE 0 END DESC,
                        wv2.year DESC NULLS LAST,
                        wv2.id DESC
                    LIMIT 1
                )
                ORDER BY wg.percentage DESC NULLS LAST, g.name ASC
                LIMIT 1
            ) main_grape ON TRUE
            WHERE (@IsAdmin = TRUE OR w.duplicate_of_wine_id IS NULL)
              AND (
                @IsAdmin = TRUE
                OR (@CurrentUserId IS NOT NULL AND wy.user_id = @CurrentUserId)
                OR wy.status IS NULL
                OR wy.status != 3
              )
              AND (
                @IsAdmin = TRUE
                OR (@CurrentUserId IS NOT NULL AND wy.user_id = @CurrentUserId)
                OR EXISTS (SELECT 1 FROM wine_vintages wv_pub WHERE wv_pub.wine_id = w.id AND wv_pub.approval_status != 3)
                OR w.source_type = 1
                OR w.winery_id IS NOT NULL
              )
            AND (@Search IS NULL
                OR w.name ILIKE @SearchPattern
                OR wy.name ILIKE @SearchPattern
                OR w.winery_name_text ILIKE @SearchPattern
                OR w.name % @Search
                OR wy.name % @Search
                OR w.winery_name_text % @Search)
            AND (@Name IS NULL
                OR w.name ILIKE @NamePattern
                OR w.name % @Name)
            AND (@Winery IS NULL
                OR wy.name ILIKE @WineryPattern
                OR w.winery_name_text ILIKE @WineryPattern
                OR wy.name % @Winery
                OR w.winery_name_text % @Winery)
            AND (@WineType IS NULL OR w.wine_type = @WineType)
            AND (@Year IS NULL OR EXISTS (
                    SELECT 1 FROM wine_vintages wv WHERE wv.wine_id = w.id AND wv.year = @Year
                    AND (@IsAdmin = TRUE
                         OR (@CurrentUserId IS NOT NULL AND (wy.user_id = @CurrentUserId OR wv.uploaded_by_user_id = @CurrentUserId))
                         OR wv.approval_status = 2
                         OR (@HasSearchTerm = TRUE AND w.source_type = 1))
                ))
            ORDER BY
                CASE WHEN @HasSearchTerm = TRUE THEN
                    GREATEST(
                        CASE WHEN @Search IS NOT NULL THEN
                            GREATEST(
                                similarity(w.name, @Search),
                                similarity(COALESCE(wy.name, w.winery_name_text, ''), @Search)
                            )
                        ELSE 0 END,
                        CASE WHEN @Name IS NOT NULL THEN similarity(w.name, @Name) ELSE 0 END,
                        CASE WHEN @Winery IS NOT NULL THEN
                            GREATEST(
                                similarity(COALESCE(wy.name, ''), @Winery),
                                similarity(COALESCE(w.winery_name_text, ''), @Winery)
                            )
                        ELSE 0 END
                    )
                ELSE 0 END DESC,
                w.review_count DESC,
                w.rating_sum DESC,
                w.name ASC,
                w.id ASC
            OFFSET @Offset LIMIT @PageSize;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<CatalogWineItemDto>(
            new CommandDefinition(sql, new
            {
                Search = cleanSearch,
                SearchPattern = cleanSearch is null ? null : $"%{cleanSearch}%",
                Name = cleanName,
                NamePattern = cleanName is null ? null : $"%{cleanName}%",
                Winery = cleanWinery,
                WineryPattern = cleanWinery is null ? null : $"%{cleanWinery}%",
                WineType = wineType.HasValue ? (int)wineType.Value : (int?)null,
                Year = year,
                CurrentUserId = currentUserId,
                IsAdmin = isAdmin,
                HasSearchTerm = hasSearchTerm,
                Offset = (pageNumber - 1) * pageSize,
                PageSize = pageSize
            }, cancellationToken: ct));
    }

    public async Task<MergeWinesResultDto> MergeWinesAsync(int targetId, int duplicateId, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            var movedVintages = 0;
            var mergedVintages = 0;
            var movedReviews = 0;
            var discardedReviews = 0;
            var movedCellarItems = 0;

            // 1. Obtener cosechas de ambos vinos
            const string getVintagesSql = "SELECT id, year FROM wine_vintages WHERE wine_id = @WineId;";
            var duplicateVintages = (await connection.QueryAsync<(int Id, int? Year)>(
                new CommandDefinition(getVintagesSql, new { WineId = duplicateId }, transaction: transaction, cancellationToken: ct))).ToList();
            var targetVintages = (await connection.QueryAsync<(int Id, int? Year)>(
                new CommandDefinition(getVintagesSql, new { WineId = targetId }, transaction: transaction, cancellationToken: ct))).ToList();

            foreach (var dupV in duplicateVintages)
            {
                var matchingTargetV = targetVintages.Cast<(int Id, int? Year)?>().FirstOrDefault(tv => tv!.Value.Year == dupV.Year);

                if (matchingTargetV is null)
                {
                    // Mover cosecha directamente al vino principal
                    const string moveVintageSql = "UPDATE wine_vintages SET wine_id = @TargetId WHERE id = @VintageId;";
                    await connection.ExecuteAsync(new CommandDefinition(
                        moveVintageSql, new { TargetId = targetId, VintageId = dupV.Id }, transaction: transaction, cancellationToken: ct));
                    movedVintages++;
                }
                else
                {
                    // Fusionar en la cosecha destino existente
                    mergedVintages++;
                    var targetVintageId = matchingTargetV.Value.Id;
                    var dupVintageId = dupV.Id;

                    // A) Reseñas
                    const string getDupReviewsSql = "SELECT id, user_id FROM reviews WHERE wine_vintage_id = @DupVintageId;";
                    var dupReviews = (await connection.QueryAsync<(int Id, int UserId)>(
                        new CommandDefinition(getDupReviewsSql, new { DupVintageId = dupVintageId }, transaction: transaction, cancellationToken: ct))).ToList();

                    foreach (var rev in dupReviews)
                    {
                        const string checkReviewSql = "SELECT 1 FROM reviews WHERE wine_vintage_id = @TargetVintageId AND user_id = @UserId LIMIT 1;";
                        var exists = await connection.ExecuteScalarAsync<bool>(
                            new CommandDefinition(checkReviewSql, new { TargetVintageId = targetVintageId, rev.UserId }, transaction: transaction, cancellationToken: ct));

                        if (exists)
                        {
                            const string deleteReviewSql = "DELETE FROM reviews WHERE id = @Id;";
                            await connection.ExecuteAsync(new CommandDefinition(
                                deleteReviewSql, new { rev.Id }, transaction: transaction, cancellationToken: ct));
                            discardedReviews++;
                        }
                        else
                        {
                            const string moveReviewSql = "UPDATE reviews SET wine_vintage_id = @TargetVintageId WHERE id = @Id;";
                            await connection.ExecuteAsync(new CommandDefinition(
                                moveReviewSql, new { TargetVintageId = targetVintageId, rev.Id }, transaction: transaction, cancellationToken: ct));
                            movedReviews++;
                        }
                    }

                    // B) Elementos de cava
                    const string getDupCellarItemsSql = "SELECT cellar_id, quantity FROM cellar_items WHERE wine_vintage_id = @DupVintageId;";
                    var dupCellarItems = (await connection.QueryAsync<(int CellarId, int Quantity)>(
                        new CommandDefinition(getDupCellarItemsSql, new { DupVintageId = dupVintageId }, transaction: transaction, cancellationToken: ct))).ToList();

                    foreach (var ci in dupCellarItems)
                    {
                        const string checkCellarItemSql = "SELECT quantity FROM cellar_items WHERE cellar_id = @CellarId AND wine_vintage_id = @TargetVintageId;";
                        var existingQty = await connection.QuerySingleOrDefaultAsync<int?>(
                            new CommandDefinition(checkCellarItemSql, new { ci.CellarId, TargetVintageId = targetVintageId }, transaction: transaction, cancellationToken: ct));

                        if (existingQty.HasValue)
                        {
                            const string sumCellarSql = """
                                UPDATE cellar_items
                                SET quantity = LEAST(999, quantity + @Quantity), updated_at = NOW()
                                WHERE cellar_id = @CellarId AND wine_vintage_id = @TargetVintageId;
                                DELETE FROM cellar_items WHERE cellar_id = @CellarId AND wine_vintage_id = @DupVintageId;
                                """;
                            await connection.ExecuteAsync(new CommandDefinition(
                                sumCellarSql, new { ci.CellarId, TargetVintageId = targetVintageId, DupVintageId = dupVintageId, ci.Quantity }, transaction: transaction, cancellationToken: ct));
                            movedCellarItems++;
                        }
                        else
                        {
                            const string moveCellarSql = """
                                UPDATE cellar_items
                                SET wine_vintage_id = @TargetVintageId
                                WHERE cellar_id = @CellarId AND wine_vintage_id = @DupVintageId;
                                """;
                            await connection.ExecuteAsync(new CommandDefinition(
                                moveCellarSql, new { ci.CellarId, TargetVintageId = targetVintageId, DupVintageId = dupVintageId }, transaction: transaction, cancellationToken: ct));
                            movedCellarItems++;
                        }
                    }

                    // C) Wine grapes: se conservan los del principal y se descartan los del duplicado
                    const string deleteGrapesSql = "DELETE FROM wine_grapes WHERE wine_vintage_id = @DupVintageId;";
                    await connection.ExecuteAsync(new CommandDefinition(
                        deleteGrapesSql, new { DupVintageId = dupVintageId }, transaction: transaction, cancellationToken: ct));

                    // D) Eliminar la cosecha del duplicado
                    const string deleteVintageSql = "DELETE FROM wine_vintages WHERE id = @DupVintageId;";
                    await connection.ExecuteAsync(new CommandDefinition(
                        deleteVintageSql, new { DupVintageId = dupVintageId }, transaction: transaction, cancellationToken: ct));

                    // E) Recalcular rating_sum y review_count de la cosecha destino
                    const string recalcTargetVintageSql = """
                        UPDATE wine_vintages
                        SET rating_sum = COALESCE((SELECT SUM(rating) FROM reviews WHERE wine_vintage_id = @TargetVintageId), 0),
                            review_count = COALESCE((SELECT COUNT(*) FROM reviews WHERE wine_vintage_id = @TargetVintageId), 0)
                        WHERE id = @TargetVintageId;
                        """;
                    await connection.ExecuteAsync(new CommandDefinition(
                        recalcTargetVintageSql, new { TargetVintageId = targetVintageId }, transaction: transaction, cancellationToken: ct));
                }
            }

            // 2. wine_pairings: copiar al principal los que falten y borrar los del duplicado
            const string mergePairingsSql = """
                INSERT INTO wine_pairings (wine_id, pairing_id)
                SELECT @TargetId, pairing_id
                FROM wine_pairings
                WHERE wine_id = @DuplicateId
                ON CONFLICT (wine_id, pairing_id) DO NOTHING;

                DELETE FROM wine_pairings WHERE wine_id = @DuplicateId;
                """;
            await connection.ExecuteAsync(new CommandDefinition(
                mergePairingsSql, new { TargetId = targetId, DuplicateId = duplicateId }, transaction: transaction, cancellationToken: ct));

            // 3. user_wines: combinar por usuario con OR y borrar los del duplicado
            const string mergeUserWinesSql = """
                INSERT INTO user_wines (user_id, wine_id, is_wanted, is_tried, is_favorite, created_at, updated_at)
                SELECT user_id, @TargetId, is_wanted, is_tried, is_favorite, created_at, NOW()
                FROM user_wines
                WHERE wine_id = @DuplicateId
                ON CONFLICT (user_id, wine_id) DO UPDATE
                SET is_wanted = user_wines.is_wanted OR EXCLUDED.is_wanted,
                    is_tried = user_wines.is_tried OR EXCLUDED.is_tried,
                    is_favorite = user_wines.is_favorite OR EXCLUDED.is_favorite,
                    updated_at = NOW();

                DELETE FROM user_wines WHERE wine_id = @DuplicateId;
                """;
            await connection.ExecuteAsync(new CommandDefinition(
                mergeUserWinesSql, new { TargetId = targetId, DuplicateId = duplicateId }, transaction: transaction, cancellationToken: ct));

            // 4. Recalcular rating_sum y review_count del vino principal
            const string recalcTargetWineSql = """
                UPDATE wines
                SET rating_sum = COALESCE((SELECT SUM(rating_sum) FROM wine_vintages WHERE wine_id = @TargetId), 0),
                    review_count = COALESCE((SELECT SUM(review_count) FROM wine_vintages WHERE wine_id = @TargetId), 0)
                WHERE id = @TargetId;
                """;
            await connection.ExecuteAsync(new CommandDefinition(
                recalcTargetWineSql, new { TargetId = targetId }, transaction: transaction, cancellationToken: ct));

            // 5. Marcar vino duplicado
            const string markDuplicateSql = """
                UPDATE wines
                SET duplicate_of_wine_id = @TargetId,
                    rating_sum = 0,
                    review_count = 0
                WHERE id = @DuplicateId;
                """;
            await connection.ExecuteAsync(new CommandDefinition(
                markDuplicateSql, new { TargetId = targetId, DuplicateId = duplicateId }, transaction: transaction, cancellationToken: ct));

            await transaction.CommitAsync(ct);

            return new MergeWinesResultDto(
                targetId,
                duplicateId,
                movedVintages,
                mergedVintages,
                movedReviews,
                discardedReviews,
                movedCellarItems);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }
}
