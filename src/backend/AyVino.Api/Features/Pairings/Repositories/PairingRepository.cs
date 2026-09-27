using AyVino.Api.Common.Data;
using AyVino.Api.Features.Pairings.Models;
using Dapper;

namespace AyVino.Api.Features.Pairings.Repositories;

public class PairingRepository(IDbConnectionFactory connectionFactory) : IPairingRepository
{
    public async Task<Pairing?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, name, category
            FROM pairings
            WHERE id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Pairing>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Pairing>> GetAllAsync(int pageNumber, int pageSize, int? category = null, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, name, category
            FROM pairings
            WHERE (@Category IS NULL OR category = @Category)
            ORDER BY name
            OFFSET @Offset LIMIT @PageSize;
            """;
        var offset = (pageNumber - 1) * pageSize;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<Pairing>(
            new CommandDefinition(sql, new { Category = category, Offset = offset, PageSize = pageSize }, cancellationToken: ct));
    }

    public async Task<int> CreateAsync(Pairing pairing, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO pairings (name, category)
            VALUES (@Name, @Category)
            RETURNING id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, pairing, cancellationToken: ct));
    }

    public async Task<bool> UpdateAsync(Pairing pairing, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE pairings
            SET name = @Name,
                category = @Category
            WHERE id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, pairing, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM pairings WHERE id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS(SELECT 1 FROM pairings WHERE id = @Id);";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Pairing>> GetByWineIdAsync(int wineId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT p.id, p.name, p.category
            FROM pairings p
            INNER JOIN wine_pairings wp ON wp.pairing_id = p.id
            WHERE wp.wine_id = @WineId
            ORDER BY p.name;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<Pairing>(
            new CommandDefinition(sql, new { WineId = wineId }, cancellationToken: ct));
    }

    public async Task AddToWineAsync(int wineId, int pairingId, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO wine_pairings (wine_id, pairing_id)
            VALUES (@WineId, @PairingId);
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await connection.ExecuteAsync(
            new CommandDefinition(sql, new { WineId = wineId, PairingId = pairingId }, cancellationToken: ct));
    }

    public async Task<bool> RemoveFromWineAsync(int wineId, int pairingId, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM wine_pairings WHERE wine_id = @WineId AND pairing_id = @PairingId;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { WineId = wineId, PairingId = pairingId }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> IsAssociatedAsync(int wineId, int pairingId, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS(SELECT 1 FROM wine_pairings WHERE wine_id = @WineId AND pairing_id = @PairingId);";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { WineId = wineId, PairingId = pairingId }, cancellationToken: ct));
    }
}