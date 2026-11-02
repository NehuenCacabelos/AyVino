using System.Data;
using AyVino.Api.Common.Data;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.History.Enums;
using AyVino.Api.Features.History.Services;
using AyVino.Api.Features.Reviews.Repositories;
using AyVino.Api.Features.UserWines.Repositories;
using Dapper;

namespace AyVino.Api.Features.Uncorks.Services;

public class UncorkTransactionRunner(
    IDbConnectionFactory connectionFactory,
    IUserWineRepository userWineRepository,
    IReviewRepository reviewRepository,
    IActivityRecorder activityRecorder) : IUncorkTransactionRunner
{
    public Task<UncorkExecutionResult> ExecuteAsync(
        int userId,
        int wineId,
        int wineVintageId,
        int? cellarId,
        int? rating,
        string? comment,
        CancellationToken ct = default)
    {
        return ExecuteAsync(userId, wineId, wineVintageId, cellarId, rating, comment, occurredAt: null, ct);
    }

    public async Task<UncorkExecutionResult> ExecuteAsync(
        int userId,
        int wineId,
        int wineVintageId,
        int? cellarId,
        int? rating,
        string? comment,
        DateTimeOffset? occurredAt,
        CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            int? remainingQuantity = null;

            // (a) Descuento de cava, si corresponde
            if (cellarId.HasValue)
            {
                const string deductSql = """
                    UPDATE cellar_items
                    SET quantity = quantity - 1, updated_at = NOW()
                    WHERE cellar_id = @CellarId AND wine_vintage_id = @WineVintageId AND quantity > 0
                    RETURNING quantity;
                    """;

                var remaining = await connection.ExecuteScalarAsync<int?>(
                    new CommandDefinition(deductSql, new
                    {
                        CellarId = cellarId.Value,
                        WineVintageId = wineVintageId
                    }, transaction, cancellationToken: ct));

                if (remaining is null)
                {
                    const string checkSql = "SELECT quantity FROM cellar_items WHERE cellar_id = @CellarId AND wine_vintage_id = @WineVintageId;";
                    var qty = await connection.ExecuteScalarAsync<int?>(
                        new CommandDefinition(checkSql, new
                        {
                            CellarId = cellarId.Value,
                            WineVintageId = wineVintageId
                        }, transaction, cancellationToken: ct));

                    if (qty is null)
                        throw new NotFoundException($"La cosecha {wineVintageId} no se encuentra en la cava {cellarId.Value}.");

                    throw new ValidationException("No quedan botellas disponibles en la cava para descorchar.");
                }

                remainingQuantity = remaining.Value;

                if (remaining.Value == 0)
                {
                    const string deleteSql = "DELETE FROM cellar_items WHERE cellar_id = @CellarId AND wine_vintage_id = @WineVintageId;";
                    await connection.ExecuteAsync(
                        new CommandDefinition(deleteSql, new
                        {
                            CellarId = cellarId.Value,
                            WineVintageId = wineVintageId
                        }, transaction, cancellationToken: ct));
                }
            }

            // (b) Marcar el vino como probado en user_wines (idempotente)
            await userWineRepository.MarkAsync(userId, wineId, wanted: false, tried: true, favorite: false, connection, transaction, ct);

            // (c) Upsert de reseña si viene rating
            int? reviewId = null;
            bool reviewCreated = false;
            if (rating.HasValue)
            {
                (reviewId, reviewCreated) = await reviewRepository.UpsertInTransactionAsync(
                    userId, wineVintageId, rating.Value, comment?.Trim(), connection, transaction, ct);
            }

            // (d) Registrar actividades (Uncorked siempre, Reviewed solo si la reseña fue creada)
            var activityTimestamp = occurredAt?.ToUniversalTime() ?? DateTimeOffset.UtcNow;
            var activityId = await activityRecorder.RecordAsync(userId, ActivityType.Uncorked, wineId, wineVintageId, connection, transaction, activityTimestamp, ct);

            if (reviewCreated)
            {
                await activityRecorder.RecordAsync(userId, ActivityType.Reviewed, wineId, wineVintageId, connection, transaction, activityTimestamp, ct);
            }

            await transaction.CommitAsync(ct);

            return new UncorkExecutionResult(activityId, remainingQuantity, reviewId, reviewCreated, activityTimestamp.UtcDateTime);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }
}
