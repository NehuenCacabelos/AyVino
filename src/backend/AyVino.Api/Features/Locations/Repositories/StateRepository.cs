using AyVino.Api.Common.Data;
using AyVino.Api.Features.States.Models;
using Dapper;

namespace AyVino.Api.Features.States.Repositories;

public class StateRepository(IDbConnectionFactory connectionFactory) : IStateRepository
{
    public async Task<State?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Name
            FROM States
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<State>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<State>> GetAllAsync(CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Name
            FROM States
            ORDER BY Name ASC;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<State>(new CommandDefinition(sql, cancellationToken: ct));
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS (SELECT 1 FROM States WHERE Id = @Id);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }
}