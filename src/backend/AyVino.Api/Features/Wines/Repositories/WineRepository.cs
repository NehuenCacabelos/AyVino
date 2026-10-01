using AyVino.Api.Common.Data;
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

    public async Task<IEnumerable<Wine>> GetAllAsync(int pageNumber, int pageSize, int? wineryId = null, int? grapeId = null, int? yearFrom = null, int? yearTo = null, CancellationToken ct = default)
    {
        // El filtro de año/uva ahora mira DENTRO de las cosechas de cada etiqueta (EXISTS),
        // porque la etiqueta en sí ya no tiene year ni grapes propios.
        const string sql = """
            SELECT w.id, w.winery_id, w.winery_name_text, w.name, w.description, w.wine_type,
                   w.location_id, w.source_type, w.duplicate_of_wine_id, w.rating_sum, w.review_count
            FROM wines w
            WHERE (@WineryId IS NULL OR w.winery_id = @WineryId)
              AND (@GrapeId IS NULL OR EXISTS (
                    SELECT 1 FROM wine_vintages wv
                    JOIN wine_grapes wg ON wg.wine_vintage_id = wv.id
                    WHERE wv.wine_id = w.id AND wg.grape_id = @GrapeId))
              AND (
                    (@YearFrom IS NULL AND @YearTo IS NULL) OR EXISTS (
                        SELECT 1 FROM wine_vintages wv2
                        WHERE wv2.wine_id = w.id
                          AND (@YearFrom IS NULL OR wv2.year >= @YearFrom)
                          AND (@YearTo IS NULL OR wv2.year <= @YearTo)
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
                new CommandDefinition(insertGrapeSql, new { WineVintageId = vintageId, grape.GrapeId, grape.Percentage },
                    transaction: transaction, cancellationToken: ct));
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
                location_id = @LocationId
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
                wine.LocationId
            }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        // wine_vintages tiene ON DELETE CASCADE hacia wines, así que borrar la etiqueta
        // se lleva puestas todas sus cosechas (y wine_grapes en cascada desde ahí también).
        const string sql = "DELETE FROM wines WHERE id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.ExecuteAsync(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS(SELECT 1 FROM wines WHERE id = @Id);";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Wine>> GetUnclaimedByNameLikeAsync(string nameFragment, CancellationToken ct = default)
    {
        var sql = $"""
            SELECT {SelectColumns}
            FROM wines
            WHERE winery_id IS NULL
              AND winery_name_text ILIKE @Pattern;
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
}