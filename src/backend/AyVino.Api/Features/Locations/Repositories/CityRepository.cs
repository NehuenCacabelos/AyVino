using AyVino.Api.Common.Data;
using AyVino.Api.Features.Cities.Models;
using Dapper;

namespace AyVino.Api.Features.Cities.Repositories;

public class CityRepository(IDbConnectionFactory connectionFactory) : ICityRepository
{
    public async Task<City?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Name, StateId, Status
            FROM Cities
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<City>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<City?> GetByNameAndStateAsync(string name, int stateId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Name, StateId, Status
            FROM Cities
            WHERE StateId = @StateId AND LOWER(Name) = LOWER(@Name);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<City>(
            new CommandDefinition(sql, new { Name = name, StateId = stateId }, cancellationToken: ct));
    }

    public async Task<IEnumerable<City>> GetAllAsync(int pageNumber, int pageSize, int? stateId, int? status, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Name, StateId, Status
            FROM Cities
            WHERE (@StateId IS NULL OR StateId = @StateId)
              AND (@Status IS NULL OR Status = @Status)
            ORDER BY Name ASC
            OFFSET @Offset LIMIT @PageSize;
            """;

        var offset = (pageNumber - 1) * pageSize;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<City>(
            new CommandDefinition(sql, new { StateId = stateId, Status = status, Offset = offset, PageSize = pageSize }, cancellationToken: ct));
    }

    public async Task<int> CreateAsync(City city, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO Cities (Name, StateId, Status)
            VALUES (@Name, @StateId, @Status)
            RETURNING Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new { city.Name, city.StateId, Status = (int)city.Status }, cancellationToken: ct));
    }

    public async Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE Cities
            SET Status = @Status
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id, Status = status }, cancellationToken: ct));

        return rowsAffected > 0;
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS (SELECT 1 FROM Cities WHERE Id = @Id);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }
}