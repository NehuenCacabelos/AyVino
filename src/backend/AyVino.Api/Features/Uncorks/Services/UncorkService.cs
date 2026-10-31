using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Uncorks.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Repositories;

namespace AyVino.Api.Features.Uncorks.Services;

public class UncorkService(
    IWineVintageRepository vintageRepository,
    ICellarRepository cellarRepository,
    IUncorkTransactionRunner transactionRunner) : IUncorkService
{
    public async Task<UncorkResponseDto> UncorkAsync(int userId, UncorkRequestDto request, CancellationToken ct = default)
    {
        // 1. Validaciones
        if (request.WineVintageId < 1)
            throw new ValidationException("El ID de la cosecha debe ser mayor a 0.");

        if (request.CellarId.HasValue && request.CellarId.Value < 1)
            throw new ValidationException("El ID de la cava debe ser mayor a 0.");

        if (!request.Rating.HasValue && !string.IsNullOrWhiteSpace(request.Comment))
            throw new ValidationException("No se puede enviar un comentario sin puntaje.");

        if (request.Rating.HasValue && (request.Rating.Value < 1 || request.Rating.Value > 5))
            throw new ValidationException("El puntaje debe estar entre 1 y 5.");

        if (request.Comment != null && request.Comment.Length > 1000)
            throw new ValidationException("El comentario no puede superar los 1000 caracteres.");

        // 2. Existencia y estado de la cosecha (Pending permitida, Rejected rechazada)
        var vintage = await vintageRepository.GetByIdAsync(request.WineVintageId, ct)
            ?? throw new NotFoundException($"Cosecha con ID {request.WineVintageId} no encontrada.");

        if (vintage.ApprovalStatus == ApprovalStatus.Rejected)
            throw new ValidationException("No se puede descorchar una cosecha rechazada.");

        // 3. Pertenencia de la cava (si viene CellarId)
        if (request.CellarId.HasValue)
        {
            var cellar = await cellarRepository.GetByIdAsync(request.CellarId.Value, userId, ct);
            if (cellar is null)
                throw new NotFoundException($"Cava con ID {request.CellarId.Value} no encontrada.");
        }

        // 4. Ejecución atómica en transacción
        var result = await transactionRunner.ExecuteAsync(
            userId,
            vintage.WineId,
            request.WineVintageId,
            request.CellarId,
            request.Rating,
            request.Comment,
            ct);

        return new UncorkResponseDto(
            result.ActivityId,
            DateTime.UtcNow,
            result.RemainingQuantity,
            result.ReviewId);
    }
}
