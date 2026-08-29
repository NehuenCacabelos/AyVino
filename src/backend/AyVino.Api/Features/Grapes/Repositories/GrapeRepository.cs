using AyVino.Api.Common.Data;
using AyVino.Api.Features.Grapes.Models;
using Dapper;

namespace AyVino.Api.Features.Grapes.Repositories;

public class GrapeRepository(IDbConnectionFactory connectionFactory) : IGrapeRepository
{
    public async Task<Grape?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Name, ColorType, TypicalBody, TypicalTannins, TypicalAcidity, Description
            FROM Grapes
            WHERE Id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Grape>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Grape>> GetAllAsync(int pageNumber, int pageSize, int? colorType = null, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Name, ColorType, TypicalBody, TypicalTannins, TypicalAcidity, Description
            FROM Grapes
            WHERE (@ColorType IS NULL OR ColorType = @ColorType)
            ORDER BY Name
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
            INSERT INTO Grapes (Name, ColorType, TypicalBody, TypicalTannins, TypicalAcidity, Description)
            VALUES (@Name, @ColorType, @TypicalBody, @TypicalTannins, @TypicalAcidity, @Description)
            RETURNING Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, grape, cancellationToken: ct));
    }

    public async Task<bool> UpdateAsync(Grape grape, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE Grapes
            SET Name = @Name,
                ColorType = @ColorType,
                TypicalBody = @TypicalBody,
                TypicalTannins = @TypicalTannins,
                TypicalAcidity = @TypicalAcidity,
                Description = @Description
            WHERE Id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, grape, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM Grapes WHERE Id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS(SELECT 1 FROM Grapes WHERE Id = @Id);";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }
}