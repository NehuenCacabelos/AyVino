using AyVino.Api.Common.Data;
using AyVino.Api.Features.Locations.Models;
using Dapper;

namespace AyVino.Api.Features.Locations.Repositories;

public class LocationRepository(IDbConnectionFactory connectionFactory) : ILocationRepository
{
    public async Task<Location?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT l.Id, l.city_id AS CityId, c.Name AS CityName, c.state_id AS StateId, s.Name AS StateName
            FROM Locations l
            INNER JOIN Cities c ON c.Id = l.city_id
            INNER JOIN States s ON s.Id = c.state_id
            WHERE l.Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Location>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<int> CreateAsync(Location location, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO Locations (city_id)
            VALUES (@CityId)
            RETURNING Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, location, cancellationToken: ct));
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS (SELECT 1 FROM Locations WHERE Id = @Id);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Location>> GetAllAsync(int pageNumber, int pageSize, CancellationToken ct = default)
    {
        const string sql = """
            SELECT l.Id, l.city_id AS CityId, c.Name AS CityName, c.state_id AS StateId, s.Name AS StateName
            FROM Locations l
            INNER JOIN Cities c ON c.Id = l.city_id
            INNER JOIN States s ON s.Id = c.state_id
            ORDER BY l.Id ASC
            OFFSET @Offset LIMIT @PageSize;
            """;

        var offset = (pageNumber - 1) * pageSize;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<Location>(
            new CommandDefinition(sql, new { Offset = offset, PageSize = pageSize }, cancellationToken: ct));
    }
}