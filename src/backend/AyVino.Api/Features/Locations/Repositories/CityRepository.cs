using AyVino.Api.Common.Data;
using AyVino.Api.Features.Locations.Models;
using Dapper;

namespace AyVino.Api.Features.Locations.Repositories;

public class CityRepository(IDbConnectionFactory connectionFactory) : ICityRepository
{
    private const string SelectColumns = "Id, Name, state_id AS StateId, Status, georef_id AS GeorefId";

    public async Task<City?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var sql = $"""
            SELECT {SelectColumns}
            FROM Cities
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<City>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<City?> GetByNameAndStateAsync(string name, int stateId, CancellationToken ct = default)
    {
        var sql = $"""
            SELECT {SelectColumns}
            FROM Cities
            WHERE state_id = @StateId AND LOWER(Name) = LOWER(@Name);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<City>(
            new CommandDefinition(sql, new { Name = name, StateId = stateId }, cancellationToken: ct));
    }

    public async Task<City?> GetByGeorefIdAsync(string georefId, CancellationToken ct = default)
    {
        var sql = $"""
            SELECT {SelectColumns}
            FROM Cities
            WHERE georef_id = @GeorefId;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<City>(
            new CommandDefinition(sql, new { GeorefId = georefId }, cancellationToken: ct));
    }

    public async Task<IEnumerable<City>> GetAllAsync(int pageNumber, int pageSize, int? stateId, int? status, CancellationToken ct = default)
    {
        var conditions = new List<string>();
        var parameters = new DynamicParameters();

        if (stateId.HasValue)
        {
            conditions.Add("state_id = @StateId");
            parameters.Add("StateId", stateId.Value);
        }

        if (status.HasValue)
        {
            conditions.Add("Status = @Status");
            parameters.Add("Status", status.Value);
        }

        var whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : string.Empty;
        var offset = (pageNumber - 1) * pageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var sql = $"""
            SELECT {SelectColumns}
            FROM Cities
            {whereClause}
            ORDER BY Name ASC
            OFFSET @Offset LIMIT @PageSize;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<City>(
            new CommandDefinition(sql, parameters, cancellationToken: ct));
    }

    public async Task<int> CreateAsync(City city, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO Cities (Name, state_id, Status, georef_id)
            VALUES (@Name, @StateId, @Status, @GeorefId)
            RETURNING Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new
            {
                city.Name,
                city.StateId,
                Status = (short)city.Status,
                city.GeorefId
            }, cancellationToken: ct));
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
