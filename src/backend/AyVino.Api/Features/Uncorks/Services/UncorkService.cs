using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Reviews.Validation;
using AyVino.Api.Features.Uncorks.DTOs;
using AyVino.Api.Features.Uncorks.Repositories;
using AyVino.Api.Features.Wines.Repositories;

namespace AyVino.Api.Features.Uncorks.Services;

public class UncorkService(
    IUncorkRepository uncorkRepository,
    IWineVintageRepository wineVintageRepository,
    ICellarRepository cellarRepository) : IUncorkService
{
    public async Task<UncorkResponseDto> CreateAsync(int userId, CreateUncorkRequestDto request, CancellationToken ct = default)
    {
        var result = await RecordAsync(
            userId,
            request.WineVintageId,
            cellarId: null,
            request.Rating,
            request.Comment,
            request.UncorkedAt,
            ct);

        return result.Uncork;
    }

    public async Task<UncorkExecutionResult> RecordAsync(
        int userId,
        int wineVintageId,
        int? cellarId,
        decimal? rating,
        string? comment,
        DateTime? uncorkedAt,
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

        var effectiveUncorkedAt = uncorkedAt ?? DateTime.UtcNow;
        if (effectiveUncorkedAt > DateTime.UtcNow.AddMinutes(5))
        {
            throw new ValidationException("La fecha de descorche no puede ser futura.");
        }

        if (effectiveUncorkedAt.Year < 1900)
        {
            throw new ValidationException("La fecha de descorche no puede ser anterior a 1900.");
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

        return await uncorkRepository.RecordUncorkInTransactionAsync(
            userId,
            wineVintageId,
            cellarId,
            rating,
            comment,
            effectiveUncorkedAt,
            ct);
    }

    public async Task<IEnumerable<UncorkListItemDto>> GetPagedByUserIdAsync(
        int userId,
        int pageNumber,
        int pageSize,
        int? wineVintageId = null,
        CancellationToken ct = default)
    {
        ValidatePagination(pageNumber, pageSize);
        return await uncorkRepository.GetPagedByUserIdAsync(userId, pageNumber, pageSize, wineVintageId, ct);
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
