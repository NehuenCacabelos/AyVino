using AyVino.Api.Features.History.DTOs;

namespace AyVino.Api.Features.History.Services;

public interface IHistoryService
{
    Task<IReadOnlyList<HistoryItemDto>> GetUserHistoryAsync(int userId, int pageNumber, int pageSize, string? type = null, CancellationToken ct = default);
}
