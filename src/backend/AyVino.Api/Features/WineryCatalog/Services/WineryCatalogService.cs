using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.WineryCatalog.Constants;
using AyVino.Api.Features.WineryCatalog.DTOs;
using AyVino.Api.Features.WineryCatalog.Models;
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
                        AverageRating: v.ReviewCount >= WineryCatalogConstants.MinReviewsForAverage ? Math.Round((decimal)v.RatingSum / v.ReviewCount, 2) : null,
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
            AverageRating: w.ReviewCount >= WineryCatalogConstants.MinReviewsForAverage ? Math.Round((decimal)w.RatingSum / w.ReviewCount, 2) : null,
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

    public async Task<WineryPublicProfileResponseDto> GetPublicProfileAsync(int wineryId, Actor? actor, CancellationToken ct = default)
    {
        var winery = await repository.GetWineryPublicProfileRowAsync(wineryId, ct)
            ?? throw new NotFoundException("Esta bodega no está disponible.");

        if (!CheckWineryVisibility(winery, actor, out var isPreview))
        {
            throw new NotFoundException("Esta bodega no está disponible.");
        }

        var isOwner = actor != null && winery.UserId.HasValue && actor.UserId == winery.UserId.Value;

        var followersCount = await repository.GetFollowersCountAsync(wineryId, ct);
        bool? isFollowedByMe = actor == null ? null : (isOwner ? false : await repository.IsFollowedByUserAsync(wineryId, actor.UserId, ct));

        var ratingsAndTotals = await repository.GetPublicRatingsAndTotalsAsync(wineryId, isPreview, ct);
        decimal? averageRating = ratingsAndTotals.ReviewCount >= WineryCatalogConstants.MinReviewsForAverage
            ? Math.Round((decimal)ratingsAndTotals.RatingSum / ratingsAndTotals.ReviewCount, 2)
            : null;

        var totalsDto = new WineryPublicTotalsDto(ratingsAndTotals.Labels, ratingsAndTotals.Vintages);

        WineryPublicLocationDto? location = null;
        if (!string.IsNullOrWhiteSpace(winery.StateName) || !string.IsNullOrWhiteSpace(winery.RegionName))
        {
            location = new WineryPublicLocationDto(winery.StateName, winery.RegionName);
        }

        return new WineryPublicProfileResponseDto(
            Id: winery.Id,
            Name: winery.Name,
            Description: winery.Description,
            FoundationYear: winery.FoundationYear,
            Website: winery.Website,
            Status: winery.Status.ToString(),
            RegisterDate: winery.RegisterDate,
            Latitude: winery.Latitude,
            Longitude: winery.Longitude,
            LogoUrl: winery.LogoUrl,
            BannerUrl: winery.BannerUrl,
            Location: location,
            FollowersCount: followersCount,
            IsFollowedByMe: isFollowedByMe,
            Totals: totalsDto,
            AverageRating: averageRating,
            ReviewCount: ratingsAndTotals.ReviewCount,
            IsPreview: isPreview,
            IsOwner: isOwner);
    }

    public async Task<WineryPublicCatalogResponseDto> GetPublicCatalogAsync(
        int wineryId,
        Actor? actor,
        WineryPublicCatalogQueryParams query,
        CancellationToken ct = default)
    {
        if (query.PageNumber < 1)
        {
            throw new ValidationException("pageNumber debe ser mayor o igual a 1.");
        }

        if (query.PageSize < 1 || query.PageSize > 50)
        {
            throw new ValidationException("pageSize debe estar entre 1 y 50.");
        }

        var winery = await repository.GetWineryPublicProfileRowAsync(wineryId, ct)
            ?? throw new NotFoundException("Esta bodega no está disponible.");

        if (!CheckWineryVisibility(winery, actor, out var isPreview))
        {
            throw new NotFoundException("Esta bodega no está disponible.");
        }

        var filters = await repository.GetPublicCatalogFiltersAsync(wineryId, isPreview, ct);
        var (totalCount, wineRows) = await repository.GetPublicCatalogWinesPagedAsync(wineryId, isPreview, query, ct);

        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling((double)totalCount / query.PageSize);
        var hasPreviousPage = query.PageNumber > 1;
        var hasNextPage = query.PageNumber < totalPages;

        if (wineRows.Count == 0)
        {
            return new WineryPublicCatalogResponseDto(
                Items: Array.Empty<WineryPublicCatalogWineDto>(),
                Filters: filters,
                PageNumber: query.PageNumber,
                PageSize: query.PageSize,
                TotalCount: totalCount,
                TotalPages: totalPages,
                HasPreviousPage: hasPreviousPage,
                HasNextPage: hasNextPage);
        }

        var wineIds = wineRows.Select(w => w.Id).ToList();
        var vintageRows = await repository.GetPublicVintagesByWineIdsAsync(wineIds, isPreview, ct);

        var vintageIds = vintageRows.Select(v => v.Id).ToList();
        var grapeRows = await repository.GetGrapesByVintageIdsAsync(vintageIds, ct);

        var grapesByVintage = grapeRows
            .GroupBy(g => g.WineVintageId)
            .ToDictionary(
                grp => grp.Key,
                grp => (IReadOnlyList<WineryPublicCatalogGrapeDto>)grp
                    .OrderByDescending(g => g.Percentage.HasValue)
                    .ThenByDescending(g => g.Percentage)
                    .ThenBy(g => g.GrapeName)
                    .Select(g => new WineryPublicCatalogGrapeDto(g.GrapeId, g.GrapeName, g.Percentage))
                    .ToList());

        var vintagesByWine = vintageRows
            .GroupBy(v => v.WineId)
            .ToDictionary(
                grp => grp.Key,
                grp => (IReadOnlyList<WineryPublicCatalogVintageDto>)grp
                    .OrderByDescending(v => v.Year.HasValue)
                    .ThenByDescending(v => v.Year)
                    .ThenByDescending(v => v.Id)
                    .Select(v => new WineryPublicCatalogVintageDto(
                        Id: v.Id,
                        Year: v.Year,
                        AlcoholContent: v.AlcoholContent,
                        ServingTemperature: v.ServingTemperature,
                        AgingAdvice: v.AgingAdvice,
                        ImageUrl: v.ImageUrl,
                        ApprovalStatus: v.ApprovalStatus.ToString(),
                        AverageRating: v.ReviewCount >= WineryCatalogConstants.MinReviewsForAverage ? Math.Round((decimal)v.RatingSum / v.ReviewCount, 2) : null,
                        ReviewCount: v.ReviewCount,
                        Grapes: grapesByVintage.TryGetValue(v.Id, out var gList) ? gList : Array.Empty<WineryPublicCatalogGrapeDto>()))
                    .ToList());

        var winesDto = wineRows.Select(w => new WineryPublicCatalogWineDto(
            Id: w.Id,
            Name: w.Name,
            Description: w.Description,
            WineType: w.WineType.ToString(),
            SourceType: w.SourceType.ToString(),
            AverageRating: w.ReviewCount >= WineryCatalogConstants.MinReviewsForAverage ? Math.Round((decimal)w.RatingSum / w.ReviewCount, 2) : null,
            ReviewCount: w.ReviewCount,
            Vintages: vintagesByWine.TryGetValue(w.Id, out var vList) ? vList : Array.Empty<WineryPublicCatalogVintageDto>()))
            .ToList();

        return new WineryPublicCatalogResponseDto(
            Items: winesDto,
            Filters: filters,
            PageNumber: query.PageNumber,
            PageSize: query.PageSize,
            TotalCount: totalCount,
            TotalPages: totalPages,
            HasPreviousPage: hasPreviousPage,
            HasNextPage: hasNextPage);
    }

    private static bool CheckWineryVisibility(WineryPublicProfileRow winery, Actor? actor, out bool isPreview)
    {
        if (winery.Status == WineryStatus.Approved)
        {
            isPreview = false;
            return true;
        }

        if (actor != null && (actor.Role == AppRoles.Admin || (winery.UserId.HasValue && actor.UserId == winery.UserId.Value)))
        {
            isPreview = true;
            return true;
        }

        isPreview = false;
        return false;
    }
}
