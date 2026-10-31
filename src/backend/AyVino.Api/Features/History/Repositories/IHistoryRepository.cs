using AyVino.Api.Features.History.DTOs;
using AyVino.Api.Features.History.Enums;

namespace AyVino.Api.Features.History.Repositories;

public interface IHistoryRepository
{
    Task<IReadOnlyList<HistoryItemDto>> GetUserHistoryAsync(int userId, int pageNumber, int pageSize, ActivityType? type = null, CancellationToken ct = default);
}
