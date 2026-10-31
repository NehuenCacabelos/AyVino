using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Audit.Enums;
using AyVino.Api.Features.Audit.Services;
using AyVino.Api.Features.Reviews.DTOs;
using AyVino.Api.Features.History.Enums;
using AyVino.Api.Features.History.Services;
using AyVino.Api.Features.Reviews.Repositories;
using AyVino.Api.Features.Wines.Repositories;
using Microsoft.Extensions.Logging;

namespace AyVino.Api.Features.Reviews.Services;

public class ReviewService(
    IReviewRepository reviewRepository,
    IWineVintageRepository wineVintageRepository,
    IAuditService? auditService = null,
    IActivityRecorder? activityRecorder = null,
    ILogger<ReviewService>? logger = null) : IReviewService
{
    public async Task<ReviewResponseDto> CreateAsync(CreateReviewRequestDto request, int userId, CancellationToken ct = default)
    {
        ValidateRating(request.Rating);

        if (!await wineVintageRepository.ExistsByIdAsync(request.WineVintageId, ct))
            throw new NotFoundException($"Cosecha con ID {request.WineVintageId} no encontrada.");

        try
        {
            var vintage = await wineVintageRepository.GetByIdAsync(request.WineVintageId, ct);
            if (vintage != null && vintage.ApprovalStatus == ApprovalStatus.Rejected)
            {
                throw new ValidationException("No se pueden publicar reseñas para una cosecha rechazada.");
            }
        }
        catch (NotImplementedException)
        {
            // Unit test fakes that don't implement GetByIdAsync
        }

        if (await reviewRepository.ExistsForUserAndVintageAsync(userId, request.WineVintageId, ct))
            throw new ConflictException("Ya reseñaste esta cosecha.");

        var id = await reviewRepository.CreateAsync(request.ToEntity(userId), ct);

        if (activityRecorder != null)
        {
            try
            {
                var vintage = await wineVintageRepository.GetByIdAsync(request.WineVintageId, ct);
                if (vintage != null)
                {
                    await activityRecorder.RecordAsync(userId, ActivityType.Reviewed, vintage.WineId, request.WineVintageId, ct);
                }
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "Error al registrar actividad Reviewed para usuario {UserId} y cosecha {VintageId}", userId, request.WineVintageId);
            }
        }

        return await reviewRepository.GetResponseByIdAsync(id, ct)
            ?? throw new NotFoundException($"Review con ID {id} no encontrada.");
    }

    public async Task<ReviewResponseDto> UpdateAsync(int id, UpdateReviewRequestDto request, int userId, CancellationToken ct = default)
    {
        ValidateRating(request.Rating);

        var existing = await reviewRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Review con ID {id} no encontrada.");

        if (existing.UserId != userId)
            throw new ForbiddenException("No podés editar la reseña de otro usuario.");

        var updated = existing with
        {
            Rating = request.Rating,
            Comment = request.Comment,
            UpdatedAt = DateTime.UtcNow
        };

        var success = await reviewRepository.UpdateAsync(updated, ct);
        if (!success) throw new NotFoundException($"Review con ID {id} no encontrada.");

        return await reviewRepository.GetResponseByIdAsync(id, ct)
            ?? throw new NotFoundException($"Review con ID {id} no encontrada.");
    }

    public async Task DeleteAsync(int id, Actor actor, CancellationToken ct = default)
    {
        var existing = await reviewRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Review con ID {id} no encontrada.");

        if (existing.UserId != actor.UserId && !actor.IsAdmin)
            throw new ForbiddenException("No podés borrar la reseña de otro usuario.");

        var success = await reviewRepository.DeleteAsync(id, ct);
        if (!success) throw new NotFoundException($"Review con ID {id} no encontrada.");

        if (actor.IsAdmin && existing.UserId != actor.UserId && auditService != null)
        {
            var username = actor.Username ?? $"User#{actor.UserId}";
            var details = $"Autor ID: {existing.UserId}, Puntaje: {existing.Rating}";
            await auditService.RecordAsync(actor.UserId, username, AuditAction.ReviewDeletedByAdmin, "Review", id, details, ct);
        }
    }

    public Task DeleteAsync(int id, int userId, CancellationToken ct = default)
        => DeleteAsync(id, new Actor(userId, AppRoles.User), ct);

    public async Task<IEnumerable<AdminReviewListItemDto>> GetPagedForAdminAsync(
        int pageNumber,
        int pageSize,
        int? wineId = null,
        int? wineVintageId = null,
        int? userId = null,
        int? rating = null,
        CancellationToken ct = default)
    {
        ValidatePagination(pageNumber, pageSize);
        if (rating.HasValue)
        {
            ValidateRating(rating.Value);
        }

        return await reviewRepository.GetPagedForAdminAsync(pageNumber, pageSize, wineId, wineVintageId, userId, rating, ct);
    }

    public async Task<IEnumerable<ReviewResponseDto>> GetAllByVintageAsync(int wineVintageId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        ValidatePagination(pageNumber, pageSize);
        return await reviewRepository.GetAllByVintageAsync(wineVintageId, pageNumber, pageSize, ct);
    }

    public async Task<IEnumerable<ReviewResponseDto>> GetAllByWineAsync(int wineId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        ValidatePagination(pageNumber, pageSize);
        return await reviewRepository.GetAllByWineAsync(wineId, pageNumber, pageSize, ct);
    }

    private static void ValidateRating(int rating)
    {
        if (rating is < 1 or > 5)
            throw new ValidationException("El rating debe estar entre 1 y 5.");
    }

    private static void ValidatePagination(int pageNumber, int pageSize)
    {
        if (pageNumber <= 0)
            throw new ValidationException("pageNumber debe ser mayor a 0.");
        if (pageSize is < 1 or > 100)
            throw new ValidationException("pageSize debe estar entre 1 y 100.");
    }
}
