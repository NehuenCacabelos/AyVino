using System.Data;
using AyVino.Api.Features.History.Enums;

namespace AyVino.Api.Features.History.Services;

public interface IActivityRecorder
{
    Task<long> RecordAsync(int userId, ActivityType type, int wineId, int? wineVintageId, CancellationToken ct = default);
    Task<long> RecordAsync(int userId, ActivityType type, int wineId, int? wineVintageId, DateTimeOffset? occurredAt, CancellationToken ct = default);
    Task<long> RecordAsync(int userId, ActivityType type, int wineId, int? wineVintageId, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default);
    Task<long> RecordAsync(int userId, ActivityType type, int wineId, int? wineVintageId, IDbConnection connection, IDbTransaction? transaction, DateTimeOffset? occurredAt, CancellationToken ct = default);
}
