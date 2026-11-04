using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Catalog.DTOs;
using AyVino.Api.Features.Catalog.Repositories;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;

namespace AyVino.Api.Features.Catalog.Services;

public class CatalogService(ICatalogRepository repository) : ICatalogService
{
    public async Task<CatalogShowcaseResponseDto> GetShowcaseAsync(
        string? q,
        string? wineType,
        int? grapeId,
        int? locationId,
        int pageNumber = 1,
        int pageSize = 6,
        int winesPerWinery = 8,
        CancellationToken ct = default)
    {
        if (pageNumber <= 0) throw new ValidationException("pageNumber debe ser mayor a 0.");
        if (pageSize is <= 0 or > 50) throw new ValidationException("pageSize debe estar entre 1 y 50.");
        if (winesPerWinery is <= 0 or > 24) throw new ValidationException("winesPerWinery debe estar entre 1 y 24.");

        WineType? parsedType = null;
        if (!string.IsNullOrWhiteSpace(wineType))
        {
            if (!Enum.TryParse<WineType>(wineType, ignoreCase: true, out var parsed))
                throw new ValidationException($"Tipo de vino inválido: '{wineType}'.");
            parsedType = parsed;
        }

        var (totalCount, wineries) = await repository.GetShowcaseWineriesPagedAsync(
            q, parsedType, grapeId, locationId, pageNumber, pageSize, ct);

        if (wineries.Count == 0)
        {
            return new CatalogShowcaseResponseDto(
                Items: Array.Empty<CatalogShowcaseWineryDto>(),
                PageNumber: pageNumber,
                PageSize: pageSize,
                TotalCount: 0,
                TotalPages: 0,
                HasNextPage: false);
        }

        var wineryKeys = wineries.Select(w => w.WineryKey).ToList();
        var wineRows = await repository.GetShowcaseWinesAsync(
            wineryKeys, q, parsedType, grapeId, locationId, winesPerWinery, ct);

        var winesByWineryKey = wineRows
            .GroupBy(w => w.WineryKey)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<WineListItemDto>)g.Select(r => new WineListItemDto(
                    r.Id,
                    r.WineryId,
                    r.WineryNameText,
                    r.Name,
                    r.Description,
                    ((WineType)r.WineType).ToString(),
                    r.LocationId,
                    ((SourceType)r.SourceType).ToString(),
                    r.DuplicateOfWineId,
                    r.ReviewCount >= 5 ? Math.Round((decimal)r.RatingSum / r.ReviewCount, 2) : null,
                    r.ReviewCount,
                    r.ThumbnailImageId,
                    r.ReferenceVintageYear
                )).ToList()
            );

        var items = wineries.Select(w => new CatalogShowcaseWineryDto(
            WineryId: w.WineryId,
            WineryName: w.WineryName,
            Location: w.Location,
            LogoImageId: w.LogoImageId,
            IsVerified: w.IsVerified,
            Wines: winesByWineryKey.TryGetValue(w.WineryKey, out var wines) ? wines : Array.Empty<WineListItemDto>()
        )).ToList();

        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        return new CatalogShowcaseResponseDto(
            Items: items,
            PageNumber: pageNumber,
            PageSize: pageSize,
            TotalCount: totalCount,
            TotalPages: totalPages,
            HasNextPage: pageNumber < totalPages);
    }

    public Task<CatalogFiltersResponseDto> GetFiltersAsync(CancellationToken ct = default) =>
        repository.GetCatalogFiltersAsync(ct);
}
