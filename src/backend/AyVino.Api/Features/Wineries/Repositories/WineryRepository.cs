using AyVino.Api.Common.Data;
using AyVino.Api.Features.Wineries.Models;
using Dapper;

namespace AyVino.Api.Features.Wineries.Repositories;

public class WineryRepository(IDbConnectionFactory connectionFactory) : IWineryRepository
{
    private const string SelectColumns = """
        w.id, w.name, w.description, w.location_id, w.foundation_year, w.website,
        w.user_id, w.status, w.register_date, w.latitude, w.longitude, w.logo_url, w.banner_url,
        s.name AS StateName, c.name AS RegionName
        FROM wineries w
        LEFT JOIN locations l ON l.id = w.location_id
        LEFT JOIN cities c ON c.id = l.city_id
        LEFT JOIN states s ON s.id = c.state_id
        """;

    public async Task<Winery?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var sql = $"""
            SELECT {SelectColumns}
            WHERE w.id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Winery>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<Winery?> GetByUserIdAsync(int userId, CancellationToken ct = default)
    {
        var sql = $"""
            SELECT {SelectColumns}
            WHERE w.user_id = @UserId;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Winery>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Winery>> GetAllAsync(int pageNumber, int pageSize, int? status = null, int? locationId = null, CancellationToken ct = default)
    {
        var conditions = new List<string>();
        var parameters = new DynamicParameters();

        if (status.HasValue)
        {
            conditions.Add("w.status = @Status");
            parameters.Add("Status", status.Value);
        }

        if (locationId.HasValue)
        {
            conditions.Add("w.location_id = @LocationId");
            parameters.Add("LocationId", locationId.Value);
        }

        var whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : string.Empty;
        var offset = (pageNumber - 1) * pageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var sql = $"""
            SELECT {SelectColumns}
            {whereClause}
            ORDER BY w.id
            OFFSET @Offset LIMIT @PageSize;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<Winery>(
            new CommandDefinition(sql, parameters, cancellationToken: ct));
    }

    public async Task<Winery> CreateAsync(Winery winery, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO wineries (name, description, location_id, foundation_year, website, user_id, status, register_date, latitude, longitude, logo_url)
            VALUES (@Name, @Description, @LocationId, @FoundationYear, @Website, @UserId, @Status, @RegisterDate, @Latitude, @Longitude, @LogoUrl)
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
                winery.RegisterDate,
                winery.Latitude,
                winery.Longitude,
                winery.LogoUrl
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
                website = @Website,
                latitude = @Latitude,
                longitude = @Longitude,
                logo_url = @LogoUrl,
                banner_url = @BannerUrl
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
                winery.Website,
                winery.Latitude,
                winery.Longitude,
                winery.LogoUrl,
                winery.BannerUrl
            }, cancellationToken: ct));
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

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = "SELECT 1 FROM wineries WHERE id = @Id LIMIT 1;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }
}
