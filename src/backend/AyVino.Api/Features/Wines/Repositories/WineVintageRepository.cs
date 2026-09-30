using AyVino.Api.Common.Data;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using Dapper;

namespace AyVino.Api.Features.Wines.Repositories;

public class WineVintageRepository(IDbConnectionFactory connectionFactory) : IWineVintageRepository
{
    private const string SelectColumns = """
        id, wine_id, year, alcohol_content, serving_temperature, aging_advice, image_url,
        approval_status, uploaded_by_user_id, register_date, rating_sum, review_count
        """;

    public async Task<WineVintage?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var sql = $"SELECT {SelectColumns} FROM wine_vintages WHERE id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<WineVintage>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<WineVintage>> GetAllByWineIdAsync(int wineId, CancellationToken ct = default)
    {
        var sql = $"SELECT {SelectColumns} FROM wine_vintages WHERE wine_id = @WineId ORDER BY year DESC NULLS LAST;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<WineVintage>(
            new CommandDefinition(sql, new { WineId = wineId }, cancellationToken: ct));
    }

    public async Task<IEnumerable<WineGrape>> GetGrapesByVintageIdAsync(int vintageId, CancellationToken ct = default)
    {
        const string sql = "SELECT wine_vintage_id, grape_id, percentage FROM wine_grapes WHERE wine_vintage_id = @VintageId;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<WineGrape>(
            new CommandDefinition(sql, new { VintageId = vintageId }, cancellationToken: ct));
    }

    public async Task<WineVintage> CreateAsync(int wineId, CreateWineVintageRequestDto dto, IEnumerable<WineGrape> grapes, CancellationToken ct = default)
    {
        const string insertVintageSql = """
            INSERT INTO wine_vintages (wine_id, year, alcohol_content, serving_temperature, aging_advice, image_url, approval_status, uploaded_by_user_id, register_date, rating_sum, review_count)
            VALUES (@WineId, @Year, @AlcoholContent, @ServingTemperature, @AgingAdvice, @ImageUrl, @ApprovalStatus, @UploadedByUserId, @RegisterDate, 0, 0)
            RETURNING id;
            """;
        const string insertGrapeSql = """
            INSERT INTO wine_grapes (wine_vintage_id, grape_id, percentage)
            VALUES (@WineVintageId, @GrapeId, @Percentage);
            """;

        var registerDate = DateTime.UtcNow;
        const int pendingStatus = (int)ApprovalStatus.Pending;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        var id = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(insertVintageSql, new
            {
                WineId = wineId,
                dto.Year,
                dto.AlcoholContent,
                dto.ServingTemperature,
                dto.AgingAdvice,
                dto.ImageUrl,
                ApprovalStatus = pendingStatus,
                dto.UploadedByUserId,
                RegisterDate = registerDate
            }, transaction: transaction, cancellationToken: ct));

        foreach (var grape in grapes)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(insertGrapeSql, new { WineVintageId = id, grape.GrapeId, grape.Percentage },
                    transaction: transaction, cancellationToken: ct));
        }

        await transaction.CommitAsync(ct);

        return new WineVintage
        {
            Id = id,
            WineId = wineId,
            Year = dto.Year,
            AlcoholContent = dto.AlcoholContent,
            ServingTemperature = dto.ServingTemperature,
            AgingAdvice = dto.AgingAdvice,
            ImageUrl = dto.ImageUrl,
            ApprovalStatus = ApprovalStatus.Pending,
            UploadedByUserId = dto.UploadedByUserId,
            RegisterDate = registerDate
        };
    }

    public async Task<bool> UpdateAsync(int id, UpdateWineVintageRequestDto dto, IEnumerable<WineGrape> grapes, CancellationToken ct = default)
    {
        const string updateSql = """
            UPDATE wine_vintages
            SET year = @Year,
                alcohol_content = @AlcoholContent,
                serving_temperature = @ServingTemperature,
                aging_advice = @AgingAdvice,
                image_url = @ImageUrl
            WHERE id = @Id;
            """;
        const string deleteGrapesSql = "DELETE FROM wine_grapes WHERE wine_vintage_id = @VintageId;";
        const string insertGrapeSql = """
            INSERT INTO wine_grapes (wine_vintage_id, grape_id, percentage)
            VALUES (@WineVintageId, @GrapeId, @Percentage);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        var rows = await connection.ExecuteAsync(
            new CommandDefinition(updateSql, new { Id = id, dto.Year, dto.AlcoholContent, dto.ServingTemperature, dto.AgingAdvice, dto.ImageUrl },
                transaction: transaction, cancellationToken: ct));

        if (rows == 0)
        {
            await transaction.RollbackAsync(ct);
            return false;
        }

        await connection.ExecuteAsync(
            new CommandDefinition(deleteGrapesSql, new { VintageId = id }, transaction: transaction, cancellationToken: ct));

        foreach (var grape in grapes)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(insertGrapeSql, new { WineVintageId = id, grape.GrapeId, grape.Percentage },
                    transaction: transaction, cancellationToken: ct));
        }

        await transaction.CommitAsync(ct);
        return true;
    }

    public async Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default)
    {
        const string sql = "UPDATE wine_vintages SET approval_status = @Status WHERE id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.ExecuteAsync(new CommandDefinition(sql, new { Id = id, Status = status }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM wine_vintages WHERE id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.ExecuteAsync(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS(SELECT 1 FROM wine_vintages WHERE id = @Id);";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }
}