using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Reviews.Validation;
using AyVino.Api.Features.Tastings.DTOs;
using AyVino.Api.Features.Tastings.Repositories;
using AyVino.Api.Features.Wines.Repositories;

namespace AyVino.Api.Features.Tastings.Services;

public class TastingService(
    ITastingRepository tastingRepository,
    IWineVintageRepository wineVintageRepository,
    ICellarRepository cellarRepository) : ITastingService
{
    public async Task<TastingResponseDto> CreateAsync(int userId, CreateTastingRequestDto request, CancellationToken ct = default)
    {
        var result = await RecordAsync(
            userId,
            request.WineVintageId,
            request.CellarId,
            request.Rating,
            request.Comment,
            request.TastedAt,
            ct);

        return result.Tasting;
    }

    public async Task<TastingExecutionResult> RecordAsync(
        int userId,
        int wineVintageId,
        int? cellarId,
        decimal? rating,
        string? comment,
        DateTime? tastedAt,
        CancellationToken ct = default)
    {
        if (!string.IsNullOrWhiteSpace(comment) && !rating.HasValue)
        {
            throw new ValidationException("El comentario requiere una calificación.");
        }

        if (comment?.Length > 1000)
        {
            throw new ValidationException("El comentario no puede superar los 1000 caracteres.");
        }

        if (rating.HasValue)
        {
            RatingValidator.Validate(rating.Value);
        }

        var effectiveTastedAt = tastedAt ?? DateTime.UtcNow;
        if (effectiveTastedAt > DateTime.UtcNow.AddMinutes(5))
        {
            throw new ValidationException("La fecha de la cata no puede ser futura.");
        }

        if (effectiveTastedAt.Year < 1900)
        {
            throw new ValidationException("La fecha de la cata no puede ser anterior a 1900.");
        }

        if (!await wineVintageRepository.ExistsByIdAsync(wineVintageId, ct))
        {
            throw new NotFoundException($"Cosecha con ID {wineVintageId} no encontrada.");
        }

        if (cellarId.HasValue)
        {
            _ = await cellarRepository.GetByIdAsync(cellarId.Value, userId, ct)
                ?? throw new NotFoundException($"Cava con ID {cellarId.Value} no encontrada.");
        }

        return await tastingRepository.RecordTastingInTransactionAsync(
            userId,
            wineVintageId,
            cellarId,
            rating,
            comment,
            effectiveTastedAt,
            ct);
    }

    public async Task<IEnumerable<TastingListItemDto>> GetPagedByUserIdAsync(
        int userId,
        int pageNumber,
        int pageSize,
        int? wineVintageId = null,
        CancellationToken ct = default)
    {
        ValidatePagination(pageNumber, pageSize);
        return await tastingRepository.GetPagedByUserIdAsync(userId, pageNumber, pageSize, wineVintageId, ct);
    }

    private static void ValidatePagination(int pageNumber, int pageSize)
    {
        if (pageNumber <= 0)
        {
            throw new ValidationException("pageNumber debe ser mayor a 0.");
        }

        if (pageSize is < 1 or > 100)
        {
            throw new ValidationException("pageSize debe estar entre 1 y 100.");
        }
    }
}
