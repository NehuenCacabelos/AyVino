using AyVino.Api.Common.Data;
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
            INSERT INTO wine_vintages (wine_id, year, alcohol_content, serving_temperature, aging_advice, image_url, approval_status, uploaded_by_user_id, register_date, rating_sum, review_count)
            VALUES (@WineId, @Year, @AlcoholContent, @ServingTemperature, @AgingAdvice, @ImageUrl, @ApprovalStatus, @UploadedByUserId, @RegisterDate, 0, 0)
            RETURNING id;
            """;
        const string insertGrapeSql = """
            INSERT INTO wine_grapes (wine_vintage_id, grape_id, percentage)
            VALUES (@WineVintageId, @GrapeId, @Percentage);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

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
                firstVintage.ImageUrl,
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
        const string sql = """
            UPDATE wines
            SET winery_id = @WineryId,
                source_type = @SourceType
            WHERE id = ANY(@WineIds)
              AND winery_id IS NULL;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteAsync(
            new CommandDefinition(sql, new
            {
                WineryId = wineryId,
                SourceType = (int)SourceType.Official,
                WineIds = wineIds.ToArray()
            }, cancellationToken: ct));
    }

    // Umbral de similitud por trigramas: 0 a 1, cuanto más alto más estricto.
    // 0.25 tolera errores de tipeo normales (letras de más/de menos, mayúsculas) sin devolver basura.
    private const double SimilarityThreshold = 0.25;
    public Task<IEnumerable<Wine>> SearchAsync(string? name, string? winery, int? year, WineType? wineType, int pageNumber, int pageSize, CancellationToken ct = default) =>
        SearchAsync(name, winery, year, wineType, pageNumber, pageSize, null, false, ct);

    public async Task<IEnumerable<Wine>> SearchAsync(string? name, string? winery, int? year, WineType? wineType, int pageNumber, int pageSize, int? currentUserId, bool isAdmin, CancellationToken ct = default)
    {
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
                         OR wv.approval_status = 2)
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
