using AyVino.Api.Common.Data;
using AyVino.Api.Features.Locations.DTOs;
using AyVino.Api.Features.Locations.Models;
using Dapper;

namespace AyVino.Api.Features.Locations.Repositories;

public class LocationRepository(IDbConnectionFactory connectionFactory) : ILocationRepository
{
    public async Task<LocationResponseDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT l.Id, l.CityId, c.Name AS CityName, c.StateId, s.Name AS StateName
            FROM Locations l
            INNER JOIN Cities c ON c.Id = l.CityId
            INNER JOIN States s ON s.Id = c.StateId
            WHERE l.Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<LocationResponseDto>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<int> CreateAsync(Location location, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO Locations (CityId)
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
}