using AyVino.Api.Features.WineCare.Models;
using AyVino.Api.Common.Data;
using Dapper;

namespace AyVino.Api.Features.WineCare.Repositories;

// Repositorio de solo lectura: una consulta por cosechas y otra por uvas, sin importar cuántas cosechas se pidan.
public class WineCareRepository(IDbConnectionFactory connectionFactory) : IWineCareRepository
{
    public async Task<IEnumerable<WineCareVintageRow>> GetVintageRowsAsync(IReadOnlyCollection<int> vintageIds, CancellationToken ct = default)
    {
        const string sql = """
            SELECT wv.id AS WineVintageId, wv.wine_id AS WineId, w.wine_type AS WineType,
                   wv.year AS Year, wv.serving_temperature AS ServingTemperature, wv.aging_advice AS AgingAdvice
            FROM wine_vintages wv
            JOIN wines w ON w.id = wv.wine_id
            WHERE wv.id = ANY(@VintageIds);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<WineCareVintageRow>(
            new CommandDefinition(sql, new { VintageIds = vintageIds.ToArray() }, cancellationToken: ct));
    }

    public async Task<IEnumerable<WineCareGrapeRow>> GetGrapeRowsAsync(IReadOnlyCollection<int> vintageIds, CancellationToken ct = default)
    {
        const string sql = """
            SELECT wg.wine_vintage_id AS WineVintageId, wg.percentage AS Percentage,
                   g.typical_body AS TypicalBody, g.typical_tannins AS TypicalTannins, g.typical_acidity AS TypicalAcidity
            FROM wine_grapes wg
            JOIN grapes g ON g.id = wg.grape_id
            WHERE wg.wine_vintage_id = ANY(@VintageIds);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<WineCareGrapeRow>(
            new CommandDefinition(sql, new { VintageIds = vintageIds.ToArray() }, cancellationToken: ct));
    }
}