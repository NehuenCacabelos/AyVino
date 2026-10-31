using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.History.DTOs;
using AyVino.Api.Features.History.Enums;
using AyVino.Api.Features.History.Repositories;

namespace AyVino.Api.Features.History.Services;

public class HistoryService(IHistoryRepository historyRepository) : IHistoryService
{
    public async Task<IReadOnlyList<HistoryItemDto>> GetUserHistoryAsync(
        int userId,
        int pageNumber,
        int pageSize,
        string? type = null,
        CancellationToken ct = default)
    {
        if (pageNumber < 1)
            throw new ValidationException("pageNumber debe ser mayor o igual a 1.");

        if (pageSize < 1 || pageSize > 100)
            throw new ValidationException("pageSize debe estar entre 1 y 100.");

        ActivityType? parsedType = null;
        if (!string.IsNullOrWhiteSpace(type))
        {
            if (!Enum.TryParse<ActivityType>(type.Trim(), ignoreCase: true, out var result))
            {
                throw new ValidationException($"Tipo de actividad inválido: '{type}'.");
            }
            parsedType = result;
        }

        return await historyRepository.GetUserHistoryAsync(userId, pageNumber, pageSize, parsedType, ct);
    }
}
