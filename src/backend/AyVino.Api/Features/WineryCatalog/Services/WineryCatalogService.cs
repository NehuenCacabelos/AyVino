using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.WineryCatalog.DTOs;
using AyVino.Api.Features.WineryCatalog.Repositories;

namespace AyVino.Api.Features.WineryCatalog.Services;

public class WineryCatalogService(IWineryCatalogRepository repository) : IWineryCatalogService
{
    private const int MaxCatalogWines = 200;

    public async Task<WineryCatalogResponseDto> GetMyCatalogAsync(int userId, CancellationToken ct = default)
    {
        var winery = await repository.GetWineryByUserIdAsync(userId, ct)
            ?? throw new NotFoundException($"Winery for user {userId} not found.");

        var totalsRow = await repository.GetTotalsByWineryIdAsync(winery.Id, ct);
        var totalsDto = new WineryCatalogTotalsDto(
            Labels: totalsRow.TotalLabels,
            Vintages: totalsRow.TotalVintages,
            VintagesApproved: totalsRow.VintagesApproved,
            VintagesPending: totalsRow.VintagesPending,
            VintagesRejected: totalsRow.VintagesRejected);

        // Pedimos 201 para determinar hasMore
        var wineRows = await repository.GetWinesByWineryIdAsync(winery.Id, MaxCatalogWines + 1, ct);
        var hasMore = wineRows.Count > MaxCatalogWines;
        var selectedWineRows = hasMore ? wineRows.Take(MaxCatalogWines).ToList() : wineRows;

        if (selectedWineRows.Count == 0)
        {
            return new WineryCatalogResponseDto(
                WineryId: winery.Id,
                WineryStatus: winery.Status.ToString(),
                Totals: totalsDto,
                HasMore: false,
                Wines: Array.Empty<WineryCatalogWineDto>());
        }

        var wineIds = selectedWineRows.Select(w => w.Id).ToList();
        var vintageRows = await repository.GetVintagesByWineIdsAsync(wineIds, ct);

        var vintageIds = vintageRows.Select(v => v.Id).ToList();
        var grapeRows = await repository.GetGrapesByVintageIdsAsync(vintageIds, ct);

        // Agrupación de uvas por cosecha
        var grapesByVintage = grapeRows
            .GroupBy(g => g.WineVintageId)
            .ToDictionary(
                grp => grp.Key,
                grp => (IReadOnlyList<WineryCatalogGrapeDto>)grp
                    .OrderByDescending(g => g.Percentage.HasValue)
                    .ThenByDescending(g => g.Percentage)
                    .ThenBy(g => g.GrapeName)
                    .Select(g => new WineryCatalogGrapeDto(g.GrapeId, g.GrapeName, g.Percentage))
                    .ToList());

        // Agrupación de cosechas por vino
        var vintagesByWine = vintageRows
            .GroupBy(v => v.WineId)
            .ToDictionary(
                grp => grp.Key,
                grp => (IReadOnlyList<WineryCatalogVintageDto>)grp
                    .OrderByDescending(v => v.Year.HasValue)
                    .ThenByDescending(v => v.Year)
                    .ThenByDescending(v => v.Id)
                    .Select(v => new WineryCatalogVintageDto(
                        Id: v.Id,
                        Year: v.Year,
                        AlcoholContent: v.AlcoholContent,
                        ServingTemperature: v.ServingTemperature,
                        AgingAdvice: v.AgingAdvice,
                        ImageUrl: v.ImageUrl,
                        ApprovalStatus: v.ApprovalStatus.ToString(),
                        AverageRating: v.ReviewCount >= 5 ? Math.Round((decimal)v.RatingSum / v.ReviewCount, 2) : null,
                        ReviewCount: v.ReviewCount,
                        RegisterDate: v.RegisterDate,
                        Grapes: grapesByVintage.TryGetValue(v.Id, out var grapesList) ? grapesList : Array.Empty<WineryCatalogGrapeDto>()))
                    .ToList());

        var winesDto = selectedWineRows.Select(w => new WineryCatalogWineDto(
            Id: w.Id,
            Name: w.Name,
            Description: w.Description,
            WineType: w.WineType.ToString(),
            SourceType: w.SourceType.ToString(),
            AverageRating: w.ReviewCount >= 5 ? Math.Round((decimal)w.RatingSum / w.ReviewCount, 2) : null,
            ReviewCount: w.ReviewCount,
            Vintages: vintagesByWine.TryGetValue(w.Id, out var vintagesList) ? vintagesList : Array.Empty<WineryCatalogVintageDto>()))
            .ToList();

        return new WineryCatalogResponseDto(
            WineryId: winery.Id,
            WineryStatus: winery.Status.ToString(),
            Totals: totalsDto,
            HasMore: hasMore,
            Wines: winesDto);
    }
}
