using AyVino.Api.Common.Data;
using AyVino.Api.Features.Ubicaciones.Models;
using Dapper;

namespace AyVino.Api.Features.Ubicaciones.Repositories;

public class UbicacionRepository(IDbConnectionFactory connectionFactory) : IUbicacionRepository
{
    public async Task<Ubicacion?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Pais, Provincia, Ciudad
            FROM Ubicaciones
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Ubicacion>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Ubicacion>> GetAllAsync(int pageNumber, int pageSize, string? pais, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Pais, Provincia, Ciudad
            FROM Ubicaciones
            WHERE (@Pais IS NULL OR LOWER(Pais) = LOWER(@Pais))
            ORDER BY Id ASC
            OFFSET @Offset LIMIT @PageSize;
            """;

        var offset = (pageNumber - 1) * pageSize;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<Ubicacion>(
            new CommandDefinition(sql, new { Pais = pais, Offset = offset, PageSize = pageSize }, cancellationToken: ct));
    }

    public async Task<int> CreateAsync(Ubicacion ubicacion, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO Ubicaciones (Pais, Provincia, Ciudad)
            VALUES (@Pais, @Provincia, @Ciudad)
            RETURNING Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, ubicacion, cancellationToken: ct));
    }

    public async Task<bool> UpdateAsync(Ubicacion ubicacion, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE Ubicaciones
            SET Pais = @Pais,
                Provincia = @Provincia,
                Ciudad = @Ciudad
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, ubicacion, cancellationToken: ct));

        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            DELETE FROM Ubicaciones
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
                SELECT 1 FROM Ubicaciones WHERE Id = @Id
            );
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }
}