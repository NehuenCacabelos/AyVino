using AyVino.Api.Common.Data;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using Dapper;

namespace AyVino.Api.Features.Wineries.Repositories;

public class WineryRepository(IDbConnectionFactory connectionFactory) : IWineryRepository
{
    public async Task<Winery?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, name, description, location_id, foundation_year, website, user_id, status, register_date
            FROM wineries
            WHERE id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Winery>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Winery>> GetAllAsync(int pageNumber, int pageSize, int? status = null, int? locationId = null, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, name, description, location_id, foundation_year, website, user_id, status, register_date
            FROM wineries
            WHERE (@Status IS NULL OR status = @Status)
              AND (@LocationId IS NULL OR location_id = @LocationId)
            ORDER BY id
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var offset = (pageNumber - 1) * pageSize;
        return await connection.QueryAsync<Winery>(
            new CommandDefinition(sql, new { Status = status, LocationId = locationId, Offset = offset, PageSize = pageSize }, cancellationToken: ct));
    }

    public async Task<Winery> CreateAsync(Winery winery, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO wineries (name, description, location_id, foundation_year, website, user_id, status, register_date)
            VALUES (@Name, @Description, @LocationId, @FoundationYear, @Website, @UserId, @Status, @RegisterDate)
            RETURNING id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);

        var id = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new
            {
                winery.Name,
                winery.Description,
                winery.LocationId,
                winery.FoundationYear,
                winery.Website,
                winery.UserId,
                Status = (int)winery.Status,
                winery.RegisterDate
            }, cancellationToken: ct));

        return winery with { Id = id };
    }

    public async Task<bool> UpdateAsync(Winery winery, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE wineries
            SET name = @Name,
                description = @Description,
                location_id = @LocationId,
                foundation_year = @FoundationYear,
                website = @Website
            WHERE id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new
            {
                winery.Id,
                winery.Name,
                winery.Description,
                winery.LocationId,
                winery.FoundationYear,
                winery.Website
            }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE wineries
            SET status = @Status
            WHERE id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id, Status = status }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM wineries WHERE id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS(SELECT 1 FROM wineries WHERE id = @Id);";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }
}