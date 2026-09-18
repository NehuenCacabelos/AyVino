using AyVino.Api.Common.Data;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using Dapper;

namespace AyVino.Api.Features.Wines.Repositories;

public class WineRepository(IDbConnectionFactory connectionFactory) : IWineRepository
{
    public async Task<Wine?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, winery_id, name, description, wine_type, location_id, year,
                   alcohol_content, serving_temperature, aging_advice, label_image_url,
                   approval_status, uploaded_by_user_id, register_date
            FROM wines
            WHERE id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Wine>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<WineGrape>> GetGrapesByWineIdAsync(int wineId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT wine_id, grape_id, percentage
            FROM wine_grapes
            WHERE wine_id = @WineId;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<WineGrape>(
            new CommandDefinition(sql, new { WineId = wineId }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Wine>> GetAllAsync(int pageNumber, int pageSize, int? wineryId = null, int? grapeId = null, int? yearFrom = null, int? yearTo = null, CancellationToken ct = default)
    {
        // grapeId filtra con EXISTS en vez de JOIN para que un vino con varias uvas que matchean
        // no aparezca duplicado en la página.
        const string sql = """
            SELECT w.id, w.winery_id, w.name, w.description, w.wine_type, w.location_id, w.year,
                   w.alcohol_content, w.serving_temperature, w.aging_advice, w.label_image_url,
                   w.approval_status, w.uploaded_by_user_id, w.register_date
            FROM wines w
            WHERE (@WineryId IS NULL OR w.winery_id = @WineryId)
              AND (@YearFrom IS NULL OR w.year >= @YearFrom)
              AND (@YearTo IS NULL OR w.year <= @YearTo)
              AND (@GrapeId IS NULL OR EXISTS (
                    SELECT 1 FROM wine_grapes wg WHERE wg.wine_id = w.id AND wg.grape_id = @GrapeId))
            ORDER BY w.id
            OFFSET @Offset LIMIT @PageSize;
            """;
        var offset = (pageNumber - 1) * pageSize;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<Wine>(
            new CommandDefinition(sql, new
            {
                WineryId = wineryId,
                GrapeId = grapeId,
                YearFrom = yearFrom,
                YearTo = yearTo,
                Offset = offset,
                PageSize = pageSize
            }, cancellationToken: ct));
    }

    public async Task<Wine> CreateAsync(CreateWineRequestDto dto, WineType wineType, IEnumerable<WineGrape> grapes, CancellationToken ct = default)
    {
        const string insertWineSql = """
            INSERT INTO wines (winery_id, name, description, wine_type, location_id, year,
                                alcohol_content, serving_temperature, aging_advice, label_image_url,
                                approval_status, uploaded_by_user_id, register_date)
            VALUES (@WineryId, @Name, @Description, @WineType, @LocationId, @Year,
                    @AlcoholContent, @ServingTemperature, @AgingAdvice, @LabelImageUrl,
                    @ApprovalStatus, @UploadedByUserId, @RegisterDate)
            RETURNING id;
            """;
        const string insertGrapeSql = """
            INSERT INTO wine_grapes (wine_id, grape_id, percentage)
            VALUES (@WineId, @GrapeId, @Percentage);
            """;

        var registerDate = DateTime.UtcNow;
        const int pendingStatus = (int)ApprovalStatus.Pending;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        // Transacción porque el vino y su lista de uvas tienen que quedar consistentes:
        // si falla el insert de una uva, no quiero un vino "fantasma" sin blend.
        await using var transaction = await connection.BeginTransactionAsync(ct);

        var id = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(insertWineSql, new
            {
                dto.WineryId,
                dto.Name,
                dto.Description,
                WineType = (int)wineType,
                dto.LocationId,
                dto.Year,
                dto.AlcoholContent,
                dto.ServingTemperature,
                dto.AgingAdvice,
                dto.LabelImageUrl,
                ApprovalStatus = pendingStatus,
                dto.UploadedByUserId,
                RegisterDate = registerDate
            }, transaction: transaction, cancellationToken: ct));

        foreach (var grape in grapes)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(insertGrapeSql, new { WineId = id, grape.GrapeId, grape.Percentage },
                    transaction: transaction, cancellationToken: ct));
        }

        await transaction.CommitAsync(ct);

        return new Wine
        {
            Id = id,
            WineryId = dto.WineryId,
            Name = dto.Name,
            Description = dto.Description,
            WineType = wineType,
            LocationId = dto.LocationId,
            Year = dto.Year,
            AlcoholContent = dto.AlcoholContent,
            ServingTemperature = dto.ServingTemperature,
            AgingAdvice = dto.AgingAdvice,
            LabelImageUrl = dto.LabelImageUrl,
            ApprovalStatus = ApprovalStatus.Pending,
            UploadedByUserId = dto.UploadedByUserId,
            RegisterDate = registerDate
        };
    }

    public async Task<bool> UpdateAsync(int id, UpdateWineRequestDto dto, WineType wineType, IEnumerable<WineGrape> grapes, CancellationToken ct = default)
    {
        const string updateWineSql = """
            UPDATE wines
            SET winery_id = @WineryId,
                name = @Name,
                description = @Description,
                wine_type = @WineType,
                location_id = @LocationId,
                year = @Year,
                alcohol_content = @AlcoholContent,
                serving_temperature = @ServingTemperature,
                aging_advice = @AgingAdvice,
                label_image_url = @LabelImageUrl
            WHERE id = @Id;
            """;
        const string deleteGrapesSql = "DELETE FROM wine_grapes WHERE wine_id = @WineId;";
        const string insertGrapeSql = """
            INSERT INTO wine_grapes (wine_id, grape_id, percentage)
            VALUES (@WineId, @GrapeId, @Percentage);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(updateWineSql, new
            {
                Id = id,
                dto.WineryId,
                dto.Name,
                dto.Description,
                WineType = (int)wineType,
                dto.LocationId,
                dto.Year,
                dto.AlcoholContent,
                dto.ServingTemperature,
                dto.AgingAdvice,
                dto.LabelImageUrl
            }, transaction: transaction, cancellationToken: ct));

        if (rowsAffected == 0)
        {
            await transaction.RollbackAsync(ct);
            return false;
        }

        // Para sincronizar el blend hago wipe + re-insert en vez de diffear uva por uva:
        // con listas chicas (2-5 uvas por vino) es más simple y no vale la pena la complejidad extra.
        await connection.ExecuteAsync(
            new CommandDefinition(deleteGrapesSql, new { WineId = id }, transaction: transaction, cancellationToken: ct));

        foreach (var grape in grapes)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(insertGrapeSql, new { WineId = id, grape.GrapeId, grape.Percentage },
                    transaction: transaction, cancellationToken: ct));
        }

        await transaction.CommitAsync(ct);
        return true;
    }

    public async Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE wines
            SET approval_status = @Status
            WHERE id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id, Status = status }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM wines WHERE id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS(SELECT 1 FROM wines WHERE id = @Id);";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }
}