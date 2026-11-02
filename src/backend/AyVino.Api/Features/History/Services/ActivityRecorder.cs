using System.Data;
using AyVino.Api.Common.Data;
using AyVino.Api.Features.History.Enums;
using Dapper;

namespace AyVino.Api.Features.History.Services;

public class ActivityRecorder(IDbConnectionFactory connectionFactory) : IActivityRecorder
{
    public Task<long> RecordAsync(int userId, ActivityType type, int wineId, int? wineVintageId, CancellationToken ct = default)
    {
        return RecordAsync(userId, type, wineId, wineVintageId, occurredAt: null, ct);
    }

    public async Task<long> RecordAsync(int userId, ActivityType type, int wineId, int? wineVintageId, DateTimeOffset? occurredAt, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await RecordAsync(userId, type, wineId, wineVintageId, connection, null, occurredAt, ct);
    }

    public Task<long> RecordAsync(int userId, ActivityType type, int wineId, int? wineVintageId, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default)
    {
        return RecordAsync(userId, type, wineId, wineVintageId, connection, transaction, occurredAt: null, ct);
    }

    public async Task<long> RecordAsync(int userId, ActivityType type, int wineId, int? wineVintageId, IDbConnection connection, IDbTransaction? transaction, DateTimeOffset? occurredAt, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO user_activities (user_id, type, wine_id, wine_vintage_id, occurred_at)
            VALUES (@UserId, @Type, @WineId, @WineVintageId, COALESCE(@OccurredAt, NOW()))
            RETURNING id;
            """;

        return await connection.ExecuteScalarAsync<long>(
            new CommandDefinition(sql, new
            {
                UserId = userId,
                Type = (short)type,
                WineId = wineId,
                WineVintageId = wineVintageId,
                OccurredAt = occurredAt?.ToUniversalTime()
            }, transaction: transaction, cancellationToken: ct));
    }
}
