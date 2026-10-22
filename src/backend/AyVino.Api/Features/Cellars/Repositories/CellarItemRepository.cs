using AyVino.Api.Common.Data;
using AyVino.Api.Features.Cellars.Models;
using Dapper;

namespace AyVino.Api.Features.Cellars.Repositories;

public class CellarItemRepository(IDbConnectionFactory connectionFactory) : ICellarItemRepository
{
    // Base compartida entre el detalle y el listado: ítem + cosecha + etiqueta.
    private const string SelectRowSql = """
        SELECT ci.wine_vintage_id AS WineVintageId, wv.wine_id AS WineId,
               w.name AS Name, w.wine_type AS WineType,
               w.winery_id AS WineryId, w.winery_name_text AS WineryNameText,
               wv.year AS Year, wv.image_url AS ImageUrl,
               wv.rating_sum AS RatingSum, wv.review_count AS ReviewCount,
               ci.quantity AS Quantity, ci.purchase_date AS PurchaseDate, ci.notes AS Notes,
               COALESCE(ci.updated_at, ci.created_at) AS LastChangeAt
        FROM cellar_items ci
        JOIN wine_vintages wv ON wv.id = ci.wine_vintage_id
        JOIN wines w ON w.id = wv.wine_id
        """;

    public async Task<CellarItem?> GetAsync(int cellarId, int wineVintageId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT cellar_id, wine_vintage_id, quantity, purchase_date, notes, created_at, updated_at
            FROM cellar_items
            WHERE cellar_id = @CellarId AND wine_vintage_id = @WineVintageId;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<CellarItem>(
            new CommandDefinition(sql, new { CellarId = cellarId, WineVintageId = wineVintageId }, cancellationToken: ct));
    }

    public async Task<CellarItemListRow?> GetRowAsync(int cellarId, int wineVintageId, CancellationToken ct = default)
    {
        const string sql = SelectRowSql + """

            WHERE ci.cellar_id = @CellarId AND ci.wine_vintage_id = @WineVintageId;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<CellarItemListRow>(
            new CommandDefinition(sql, new { CellarId = cellarId, WineVintageId = wineVintageId }, cancellationToken: ct));
    }

    public async Task<IEnumerable<CellarItemListRow>> GetAllByCellarAsync(int cellarId, int pageNumber, int pageSize, int? wineType, int? year, CancellationToken ct = default)
    {
        const string sql = SelectRowSql + """

            WHERE ci.cellar_id = @CellarId
              AND (@WineType IS NULL OR w.wine_type = @WineType)
              AND (@Year IS NULL OR wv.year = @Year)
            ORDER BY w.name, wv.year DESC NULLS LAST, ci.wine_vintage_id
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<CellarItemListRow>(
            new CommandDefinition(sql, new
            {
                CellarId = cellarId,
                WineType = wineType,
                Year = year,
                Offset = (pageNumber - 1) * pageSize,
                PageSize = pageSize
            }, cancellationToken: ct));
    }

    public async Task CreateAsync(CellarItem item, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO cellar_items (cellar_id, wine_vintage_id, quantity, purchase_date, notes)
            VALUES (@CellarId, @WineVintageId, @Quantity, @PurchaseDate, @Notes);
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(
            new CommandDefinition(sql, new
            {
                item.CellarId,
                item.WineVintageId,
                item.Quantity,
                item.PurchaseDate,
                item.Notes
            }, cancellationToken: ct));
    }

    public async Task<bool> UpdateAsync(int cellarId, int wineVintageId, int quantity, DateOnly? purchaseDate, string? notes, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE cellar_items
            SET quantity = @Quantity, purchase_date = @PurchaseDate, notes = @Notes,
                updated_at = now() AT TIME ZONE 'utc'
            WHERE cellar_id = @CellarId AND wine_vintage_id = @WineVintageId;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new
            {
                CellarId = cellarId,
                WineVintageId = wineVintageId,
                Quantity = quantity,
                PurchaseDate = purchaseDate,
                Notes = notes
            }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int cellarId, int wineVintageId, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM cellar_items WHERE cellar_id = @CellarId AND wine_vintage_id = @WineVintageId;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { CellarId = cellarId, WineVintageId = wineVintageId }, cancellationToken: ct));
        return rowsAffected > 0;
    }
        public async Task<IReadOnlyList<int>> GetVintageIdsAsync(int cellarId, CancellationToken ct = default)
    {
        const string sql = "SELECT wine_vintage_id FROM cellar_items WHERE cellar_id = @CellarId ORDER BY wine_vintage_id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var ids = await connection.QueryAsync<int>(
            new CommandDefinition(sql, new { CellarId = cellarId }, cancellationToken: ct));
        return ids.ToList();
    }
}