namespace AyVino.Api.Features.Uncorks.Services;

public record UncorkExecutionResult(
    long ActivityId,
    int? RemainingQuantity,
    int? ReviewId,
    bool ReviewCreated,
    DateTime OccurredAt = default);

public interface IUncorkTransactionRunner
{
    Task<UncorkExecutionResult> ExecuteAsync(
        int userId,
        int wineId,
        int wineVintageId,
        int? cellarId,
        int? rating,
        string? comment,
        CancellationToken ct = default);

    Task<UncorkExecutionResult> ExecuteAsync(
        int userId,
        int wineId,
        int wineVintageId,
        int? cellarId,
        int? rating,
        string? comment,
        DateTimeOffset? occurredAt,
        CancellationToken ct = default);
}
