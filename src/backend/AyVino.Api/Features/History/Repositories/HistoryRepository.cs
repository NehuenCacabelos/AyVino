using AyVino.Api.Common.Data;
using AyVino.Api.Features.History.DTOs;
using AyVino.Api.Features.History.Enums;
using AyVino.Api.Features.Wines.Enums;
using Dapper;

namespace AyVino.Api.Features.History.Repositories;

public class HistoryRepository(IDbConnectionFactory connectionFactory) : IHistoryRepository
{
    private record RawHistoryRow(
        long Id,
        short Type,
        DateTime OccurredAt,
        int WineId,
        string WineName,
        string? WineryName,
        short WineType,
        int? VintageId,
        int? VintageYear,
        Guid? VintageImageId,
        Guid? PersonalImageId,
        short? ReviewRating,
        string? ReviewComment);

    public async Task<IReadOnlyList<HistoryItemDto>> GetUserHistoryAsync(
        int userId,
        int pageNumber,
        int pageSize,
        ActivityType? type = null,
        CancellationToken ct = default)
    {
        var offset = (pageNumber - 1) * pageSize;

        const string sql = """
            SELECT 
                ua.id AS Id,
                ua.type AS Type,
                ua.occurred_at AS OccurredAt,
                w.id AS WineId,
                w.name AS WineName,
                COALESCE(wy.name, w.winery_name_text) AS WineryName,
                w.wine_type AS WineType,
                v.id AS VintageId,
                v.year AS VintageYear,
                v.image_id AS VintageImageId,
                uvi.image_id AS PersonalImageId,
                CASE WHEN ua.type IN (1, 2) THEN r.rating ELSE NULL END AS ReviewRating,
                CASE WHEN ua.type IN (1, 2) THEN r.comment ELSE NULL END AS ReviewComment
            FROM user_activities ua
            INNER JOIN wines w ON w.id = ua.wine_id
            LEFT JOIN wineries wy ON wy.id = w.winery_id
            LEFT JOIN wine_vintages v ON v.id = ua.wine_vintage_id
            LEFT JOIN user_vintage_images uvi ON uvi.user_id = ua.user_id AND uvi.wine_vintage_id = ua.wine_vintage_id
            LEFT JOIN reviews r ON r.user_id = ua.user_id AND r.wine_vintage_id = ua.wine_vintage_id
            WHERE ua.user_id = @UserId
              AND (@Type IS NULL OR ua.type = @Type)
            ORDER BY ua.occurred_at DESC, ua.id DESC
            LIMIT @PageSize OFFSET @Offset;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rows = await connection.QueryAsync<RawHistoryRow>(
            new CommandDefinition(sql, new
            {
                UserId = userId,
                Type = (short?)type,
                PageSize = pageSize,
                Offset = offset
            }, cancellationToken: ct));

        return rows.Select(r => new HistoryItemDto(
            r.Id,
            ((ActivityType)r.Type).ToString(),
            r.OccurredAt,
            new HistoryWineDto(
                r.WineId,
                r.WineName,
                r.WineryName,
                ((WineType)r.WineType).ToString()),
            r.VintageId.HasValue
                ? new HistoryVintageDto(r.VintageId.Value, r.VintageYear, r.VintageImageId)
                : null,
            r.PersonalImageId,
            (int?)r.ReviewRating,
            r.ReviewComment
        )).ToList();
    }
}
