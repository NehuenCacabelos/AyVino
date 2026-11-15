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
        var conditions = new List<string>();
        var parameters = new DynamicParameters();

        if (action.HasValue)
        {
            conditions.Add("action = @Action");
            parameters.Add("Action", action.Value);
        }

        if (!string.IsNullOrWhiteSpace(entityType))
        {
            conditions.Add("entity_type = @EntityType");
            parameters.Add("EntityType", entityType.Trim());
        }

        if (userId.HasValue)
        {
            conditions.Add("user_id = @UserId");
            parameters.Add("UserId", userId.Value);
        }

        if (from.HasValue)
        {
            conditions.Add("created_at >= @From");
            parameters.Add("From", from.Value);
        }

        if (to.HasValue)
        {
            conditions.Add("created_at <= @To");
            parameters.Add("To", to.Value);
        }

        var whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : string.Empty;
        var offset = (pageNumber - 1) * pageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var sql = $"""
            SELECT id AS Id,
                   user_id AS UserId,
                   username AS Username,
                   action AS Action,
                   entity_type AS EntityType,
                   entity_id AS EntityId,
                   details AS Details,
                   created_at AS CreatedAt
            FROM audit_log
            {whereClause}
            ORDER BY created_at DESC, id DESC
            OFFSET @Offset LIMIT @PageSize;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<AuditLogEntry>(
            new CommandDefinition(sql, parameters, cancellationToken: ct));
    }
}
