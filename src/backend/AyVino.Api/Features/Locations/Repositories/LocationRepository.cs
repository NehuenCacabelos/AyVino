using AyVino.Api.Common.Data;
using AyVino.Api.Features.Locations.Models;
using Dapper;

namespace AyVino.Api.Features.Locations.Repositories;

public class LocationRepository(IDbConnectionFactory connectionFactory) : ILocationRepository
{
    public async Task<Location?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Country, State, City
            FROM Locations
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Location>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Location>> GetAllAsync(int pageNumber, int pageSize, string? country, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Country, State, City
            FROM Locations
            WHERE (@Country IS NULL OR LOWER(Country) = LOWER(@Country))
            ORDER BY Id ASC
            OFFSET @Offset LIMIT @PageSize;
            """;

        var offset = (pageNumber - 1) * pageSize;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<Location>(
            new CommandDefinition(sql, new { Country = country, Offset = offset, PageSize = pageSize }, cancellationToken: ct));
    }

    public async Task<int> CreateAsync(Location location, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO Locations (Country, State, City)
            VALUES (@Country, @State, @City)
            RETURNING Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, location, cancellationToken: ct));
    }

    public async Task<bool> UpdateAsync(Location location, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE Locations
            SET Country = @Country,
                State = @State,
                City = @City
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, location, cancellationToken: ct));

        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            DELETE FROM Locations
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));

        return rowsAffected > 0;
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1 FROM Locations WHERE Id = @Id
            );
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }
}