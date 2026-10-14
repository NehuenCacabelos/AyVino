using AyVino.Api.Common.Data;
using AyVino.Api.Features.Grapes.Models;
using Dapper;

namespace AyVino.Api.Features.Grapes.Repositories;

public class GrapeRepository(IDbConnectionFactory connectionFactory) : IGrapeRepository
{
    public async Task<Grape?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, name, color_type, typical_body, typical_tannins, typical_acidity, description
            FROM grapes
            WHERE id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Grape>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Grape>> GetAllAsync(int pageNumber, int pageSize, int? colorType = null, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, name, color_type, typical_body, typical_tannins, typical_acidity, description
            FROM grapes
            WHERE (@ColorType IS NULL OR color_type = @ColorType)
            ORDER BY name
            OFFSET @Offset LIMIT @PageSize;
            """;
        var offset = (pageNumber - 1) * pageSize;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<Grape>(
            new CommandDefinition(sql, new { ColorType = colorType, Offset = offset, PageSize = pageSize }, cancellationToken: ct));
    }

    public async Task<int> CreateAsync(Grape grape, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO grapes (name, color_type, typical_body, typical_tannins, typical_acidity, description)
            VALUES (@Name, @ColorType, @TypicalBody, @TypicalTannins, @TypicalAcidity, @Description)
            RETURNING id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, grape, cancellationToken: ct));
    }

    public async Task<bool> UpdateAsync(Grape grape, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE grapes
            SET name = @Name,
                color_type = @ColorType,
                typical_body = @TypicalBody,
                typical_tannins = @TypicalTannins,
                typical_acidity = @TypicalAcidity,
                description = @Description
            WHERE id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, grape, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM grapes WHERE id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS(SELECT 1 FROM grapes WHERE id = @Id);";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }
}