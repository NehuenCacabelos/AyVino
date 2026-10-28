using AyVino.Api.Common.Data;
using AyVino.Api.Features.Audit.Models;
using Dapper;

namespace AyVino.Api.Features.Audit.Repositories;

public class AuditRepository(IDbConnectionFactory connectionFactory) : IAuditRepository
{
    public async Task<AuditLogEntry> CreateAsync(AuditLogEntry entry, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO audit_log (user_id, username, action, entity_type, entity_id, details, created_at)
            VALUES (@UserId, @Username, @Action, @EntityType, @EntityId, @Details, @CreatedAt)
            RETURNING id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var id = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new
            {
                entry.UserId,
                entry.Username,
                Action = (short)entry.Action,
                entry.EntityType,
                entry.EntityId,
                entry.Details,
                entry.CreatedAt
            }, cancellationToken: ct));

        return entry with { Id = id };
    }

    public async Task<IEnumerable<AuditLogEntry>> GetPagedAsync(
        int pageNumber,
        int pageSize,
        short? action = null,
        string? entityType = null,
        int? userId = null,
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken ct = default)
    {
        const string sql = """
            SELECT id AS Id,
                   user_id AS UserId,
                   username AS Username,
                   action AS Action,
                   entity_type AS EntityType,
                   entity_id AS EntityId,
                   details AS Details,
                   created_at AS CreatedAt
            FROM audit_log
            WHERE (@Action IS NULL OR action = @Action)
              AND (@EntityType IS NULL OR entity_type = @EntityType)
              AND (@UserId IS NULL OR user_id = @UserId)
              AND (@From IS NULL OR created_at >= @From)
              AND (@To IS NULL OR created_at <= @To)
            ORDER BY created_at DESC, id DESC
            OFFSET @Offset LIMIT @PageSize;
            """;

        var offset = (pageNumber - 1) * pageSize;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);

        return await connection.QueryAsync<AuditLogEntry>(
            new CommandDefinition(sql, new
            {
                Action = action,
                EntityType = entityType,
                UserId = userId,
                From = from,
                To = to,
                Offset = offset,
                PageSize = pageSize
            }, cancellationToken: ct));
    }
}
