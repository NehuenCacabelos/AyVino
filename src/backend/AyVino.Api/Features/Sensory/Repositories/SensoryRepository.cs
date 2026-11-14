using AyVino.Api.Common.Data;
using AyVino.Api.Features.Sensory.Models;
using Dapper;

namespace AyVino.Api.Features.Sensory.Repositories;

public class SensoryRepository(IDbConnectionFactory connectionFactory) : ISensoryRepository
{
    private const string SelectColumns = """
        wine_vintage_id AS WineVintageId,
        body AS Body,
        tannins AS Tannins,
        acidity AS Acidity,
        fruit AS Fruit,
        oak AS Oak,
        persistence AS Persistence,
        updated_at AS UpdatedAt
        """;

    public async Task<WineVintageSensory?> GetByVintageIdAsync(int vintageId, CancellationToken ct = default)
    {
        const string sql = $"""
            SELECT {SelectColumns}
            FROM wine_vintage_sensory
            WHERE wine_vintage_id = @VintageId;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<WineVintageSensory>(
            new CommandDefinition(sql, new { VintageId = vintageId }, cancellationToken: ct));
    }

    public async Task UpsertAsync(WineVintageSensory sensory, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO wine_vintage_sensory (wine_vintage_id, body, tannins, acidity, fruit, oak, persistence, updated_at)
            VALUES (@WineVintageId, @Body, @Tannins, @Acidity, @Fruit, @Oak, @Persistence, NOW())
            ON CONFLICT (wine_vintage_id) DO UPDATE
            SET body = EXCLUDED.body,
                tannins = EXCLUDED.tannins,
                acidity = EXCLUDED.acidity,
                fruit = EXCLUDED.fruit,
                oak = EXCLUDED.oak,
                persistence = EXCLUDED.persistence,
                updated_at = NOW();
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                sensory.WineVintageId,
                sensory.Body,
                sensory.Tannins,
                sensory.Acidity,
                sensory.Fruit,
                sensory.Oak,
                sensory.Persistence
            },
            cancellationToken: ct));
    }

    public async Task<bool> DeleteAsync(int vintageId, CancellationToken ct = default)
    {
        const string sql = """
            DELETE FROM wine_vintage_sensory
            WHERE wine_vintage_id = @VintageId;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { VintageId = vintageId }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<IReadOnlyList<GrapeWithSensoryRow>> GetVintageGrapesWithTypicalValuesAsync(int vintageId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT wg.grape_id AS GrapeId,
                   wg.percentage AS Percentage,
                   g.typical_body AS TypicalBody,
                   g.typical_tannins AS TypicalTannins,
                   g.typical_acidity AS TypicalAcidity
            FROM wine_grapes wg
            JOIN grapes g ON g.id = wg.grape_id
            WHERE wg.wine_vintage_id = @VintageId;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var results = await connection.QueryAsync<GrapeWithSensoryRow>(
            new CommandDefinition(sql, new { VintageId = vintageId }, cancellationToken: ct));
        return results.ToList();
    }

    public async Task<IReadOnlyDictionary<int, GrapeSensoryValuesRow>> GetGrapeTypicalValuesByIdsAsync(IEnumerable<int> grapeIds, CancellationToken ct = default)
    {
        var idList = grapeIds.Distinct().ToList();
        if (idList.Count == 0)
        {
            return new Dictionary<int, GrapeSensoryValuesRow>();
        }

        const string sql = """
            SELECT id AS GrapeId,
                   typical_body AS TypicalBody,
                   typical_tannins AS TypicalTannins,
                   typical_acidity AS TypicalAcidity
            FROM grapes
            WHERE id = ANY(@Ids);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var results = await connection.QueryAsync<GrapeSensoryValuesRow>(
            new CommandDefinition(sql, new { Ids = idList }, cancellationToken: ct));
        return results.ToDictionary(r => r.GrapeId);
    }
}
