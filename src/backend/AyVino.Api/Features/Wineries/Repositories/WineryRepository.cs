using AyVino.Api.Common.Data;
using AyVino.Api.Features.Wineries.DTOs;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using Dapper;

namespace AyVino.Api.Features.Wineries.Repositories;

public class WineryRepository(IDbConnectionFactory connectionFactory) : IWineryRepository
{
    public async Task<Winery?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Name, Description, LocationId, FoundationYear, Website, UserId, Status, RegisterDate
            FROM Wineries
            WHERE Id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Winery>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Winery>> GetAllAsync(int pageNumber, int pageSize, int? status = null, int? locationId = null, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Name, Description, LocationId, FoundationYear, Website, UserId, Status, RegisterDate
            FROM Wineries
            WHERE (@Status IS NULL OR Status = @Status)
              AND (@LocationId IS NULL OR LocationId = @LocationId)
            ORDER BY Id
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var offset = (pageNumber - 1) * pageSize;
        return await connection.QueryAsync<Winery>(
            new CommandDefinition(sql, new { Status = status, LocationId = locationId, Offset = offset, PageSize = pageSize }, cancellationToken: ct));
    }

    public async Task<Winery> CreateAsync(int? userId, CreateWineryRequestDto dto, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO Wineries (Name, Description, LocationId, FoundationYear, Website, UserId, Status, RegisterDate)
            VALUES (@Name, @Description, @LocationId, @FoundationYear, @Website, @UserId, @Status, @RegisterDate)
            RETURNING Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);

        var registerDate = DateTime.UtcNow;
        const int pendingStatus = (int)WineryStatus.Pending;

        var id = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new
            {
                dto.Name,
                dto.Description,
                dto.LocationId,
                dto.FoundationYear,
                dto.Website,
                UserId = userId,
                Status = pendingStatus,
                RegisterDate = registerDate
            }, cancellationToken: ct));

        return new Winery
        {
            Id = id,
            Name = dto.Name,
            Description = dto.Description,
            LocationId = dto.LocationId,
            FoundationYear = dto.FoundationYear,
            Website = dto.Website,
            UserId = userId,
            Status = WineryStatus.Pending,
            RegisterDate = registerDate
        };
    }

    public async Task<bool> UpdateAsync(int id, UpdateWineryRequestDto dto, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE Wineries
            SET Name = @Name,
                Description = @Description,
                LocationId = @LocationId,
                FoundationYear = @FoundationYear,
                Website = @Website
            WHERE Id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id, dto.Name, dto.Description, dto.LocationId, dto.FoundationYear, dto.Website }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE Wineries
            SET Status = @Status
            WHERE Id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id, Status = status }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM Wineries WHERE Id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS(SELECT 1 FROM Wineries WHERE Id = @Id);";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }
}