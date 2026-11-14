using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Grapes.Enums;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;

namespace AyVino.Api.Features.Cellars.Services;

public class CellarItemService(
    ICellarRepository cellarRepository,
    ICellarItemRepository itemRepository,
    IWineVintageRepository wineVintageRepository,
    IWineRepository? wineRepository = null,
    IGrapeRepository? grapeRepository = null) : ICellarItemService
{
    private const int MaxQuantity = 999;
    private const int MaxNotesLength = 500;

    public async Task<CellarItemResponseDto> QuickAddAsync(int userId, int? cellarId, QuickAddCellarWineRequestDto request, CancellationToken ct = default)
    {
        if (wineRepository is null)
            throw new InvalidOperationException("WineRepository is required for QuickAdd.");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ValidationException("El nombre del vino es obligatorio.");
        if (string.IsNullOrWhiteSpace(request.WineryName))
            throw new ValidationException("El nombre de la bodega es obligatorio.");
        if (request.Quantity is < 1 or > MaxQuantity)
            throw new ValidationException($"La cantidad debe estar entre 1 y {MaxQuantity}.");
        if (!Enum.TryParse<WineType>(request.WineType, ignoreCase: true, out var parsedWineType) || !Enum.IsDefined(parsedWineType))
            throw new ValidationException($"Tipo de vino inválido: '{request.WineType}'.");

        // 1. Resolver Cava
        int resolvedCellarId;
        if (cellarId.HasValue && cellarId.Value > 0)
        {
            await EnsureCellarOwnedAsync(userId, cellarId.Value, ct);
            resolvedCellarId = cellarId.Value;
        }
        else
        {
            var cellars = await cellarRepository.GetAllByUserAsync(userId, 1, 1, ct);
            var firstCellar = cellars.FirstOrDefault();
            if (firstCellar is not null)
            {
                resolvedCellarId = firstCellar.Id;
            }
            else
            {
                resolvedCellarId = await cellarRepository.CreateAsync(userId, "Mi Cava", ct);
            }
        }

        // 2. Resolver Etiqueta y Añada
        int targetVintageId;

        if (request.MatchedWineId.HasValue)
        {
            var existingWine = await wineRepository.GetByIdAsync(request.MatchedWineId.Value, ct)
                ?? throw new NotFoundException($"Vino con ID {request.MatchedWineId.Value} no encontrado.");

            var vintages = await wineVintageRepository.GetAllByWineIdAsync(existingWine.Id, ct);
            var matchingVintage = vintages.FirstOrDefault(v => v.Year == request.Year);

            if (matchingVintage is not null)
            {
                targetVintageId = matchingVintage.Id;
            }
            else
            {
                var newVintage = new WineVintage
                {
                    WineId = existingWine.Id,
                    Year = request.Year,
                    ApprovalStatus = ApprovalStatus.Pending,
                    UploadedByUserId = userId,
                    RegisterDate = DateTime.UtcNow
                };
                var createdVintage = await wineVintageRepository.CreateAsync(newVintage, Enumerable.Empty<WineGrape>(), ct);
                targetVintageId = createdVintage.Id;
            }
        }
        else
        {
            if (grapeRepository is null)
                throw new InvalidOperationException("GrapeRepository is required for QuickAdd creating a new wine.");

            List<WineGrape> grapes = [];

            if (parsedWineType is WineType.Red or WineType.White)
            {
                if (!request.MainGrapeId.HasValue)
                {
                    throw new ValidationException("La uva principal es obligatoria para vinos tintos y blancos.");
                }
            }

            if (request.MainGrapeId.HasValue)
            {
                var grape = await grapeRepository.GetByIdAsync(request.MainGrapeId.Value, ct)
                    ?? throw new ValidationException($"La uva con ID {request.MainGrapeId.Value} no existe.");

                if (parsedWineType == WineType.Red && grape.ColorType != ColorType.Red)
                {
                    throw new ValidationException("Los vinos tintos exigen una uva tinta.");
                }

                if (parsedWineType == WineType.Orange && grape.ColorType != ColorType.White && grape.ColorType != ColorType.Rose)
                {
                    throw new ValidationException("Los vinos naranjos solo aceptan uvas blancas o de piel rosada.");
                }

                grapes.Add(new WineGrape { GrapeId = grape.Id, Percentage = 100 });
            }

            var wineEntity = new Wine
            {
                Name = request.Name.Trim(),
                WineType = parsedWineType,
                WineryNameText = request.WineryName.Trim(),
                WineryId = null,
                SourceType = SourceType.Community
            };

            var firstVintageEntity = new WineVintage
            {
                Year = request.Year,
                ApprovalStatus = ApprovalStatus.Pending,
                UploadedByUserId = userId,
                RegisterDate = DateTime.UtcNow
            };

            var createdWine = await wineRepository.CreateWithFirstVintageAsync(wineEntity, firstVintageEntity, grapes, ct);
            var vintages = await wineVintageRepository.GetAllByWineIdAsync(createdWine.Id, ct);
            var createdVintage = vintages.FirstOrDefault()
                ?? throw new InvalidOperationException("Failed to retrieve created wine vintage.");
            targetVintageId = createdVintage.Id;
        }

        // 3. Formatear notas con ubicación si se especificó
        var combinedNotes = FormatCombinedNotes(request.Location, request.Notes);

        // 4. Guardar o actualizar en cellar_items
        var existingItem = await itemRepository.GetAsync(resolvedCellarId, targetVintageId, ct);
        if (existingItem is not null)
        {
            var newQuantity = Math.Min(MaxQuantity, existingItem.Quantity + request.Quantity);
            var notesToKeep = !string.IsNullOrWhiteSpace(combinedNotes) ? combinedNotes : existingItem.Notes;
            await itemRepository.UpdateAsync(resolvedCellarId, targetVintageId, newQuantity, existingItem.PurchaseDate, notesToKeep, ct);
        }
        else
        {
            var newItem = new CellarItem
            {
                CellarId = resolvedCellarId,
                WineVintageId = targetVintageId,
                Quantity = request.Quantity,
                PurchaseDate = DateOnly.FromDateTime(DateTime.UtcNow),
                Notes = combinedNotes,
                CreatedAt = DateTime.UtcNow
            };
            await itemRepository.CreateAsync(newItem, ct);
        }

        return await GetRowOrThrowAsync(resolvedCellarId, targetVintageId, ct);
    }

    public async Task<CellarItemResponseDto> AddAsync(int userId, int cellarId, AddCellarItemRequestDto request, CancellationToken ct = default)
    {
        ValidateItemData(request.Quantity, request.PurchaseDate, request.Notes);
        await EnsureCellarOwnedAsync(userId, cellarId, ct);

        // Solo se exige que la cosecha exista (igual que Reviews): las Pending también se pueden guardar.
        var vintageExists = request.WineVintageId > 0
            && await wineVintageRepository.ExistsByIdAsync(request.WineVintageId, ct);
        if (!vintageExists)
            throw new NotFoundException($"Cosecha con ID {request.WineVintageId} no encontrada.");

        if (await itemRepository.GetAsync(cellarId, request.WineVintageId, ct) is not null)
            throw new ConflictException("Esta cosecha ya está en la cava. Editá la cantidad.");

        var normalized = request with { Notes = NormalizeNotes(request.Notes) };
        await itemRepository.CreateAsync(normalized.ToEntity(cellarId), ct);

        return await GetRowOrThrowAsync(cellarId, request.WineVintageId, ct);
    }

    public async Task<IReadOnlyList<CellarItemResponseDto>> GetAllAsync(int userId, int cellarId, int pageNumber, int pageSize, string? wineType, int? year, CancellationToken ct = default)
    {
        ValidatePaging(pageNumber, pageSize);

        // Un string no es confiable: se parsea acá y el Repository solo recibe el int.
        int? wineTypeValue = null;
        if (!string.IsNullOrWhiteSpace(wineType))
        {
            if (!Enum.TryParse<WineType>(wineType, ignoreCase: true, out var parsed) || !Enum.IsDefined(parsed))
                throw new ValidationException($"Tipo de vino inválido: '{wineType}'.");
            wineTypeValue = (int)parsed;
        }

        await EnsureCellarOwnedAsync(userId, cellarId, ct);

        var rows = await itemRepository.GetAllByCellarAsync(cellarId, pageNumber, pageSize, wineTypeValue, year, ct);
        return rows.ToResponseDtoList();
    }

    public async Task<IReadOnlyList<PublicCellarItemResponseDto>> GetPublicCellarItemsAsync(string username, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(username))
            throw new NotFoundException($"Usuario '{username}' no encontrado.");

        if (pageNumber < 1 || pageSize < 1 || pageSize > 100)
            throw new ValidationException("Los parámetros de paginación no son válidos.");

        var rows = await itemRepository.GetAllByUsernameAsync(username.Trim(), pageNumber, pageSize, ct);
        return rows.ToPublicResponseDtoList();
    }

    public async Task<CellarItemResponseDto> GetAsync(int userId, int cellarId, int wineVintageId, CancellationToken ct = default)
    {
        await EnsureCellarOwnedAsync(userId, cellarId, ct);
        return await GetRowOrThrowAsync(cellarId, wineVintageId, ct);
    }

    public async Task<CellarItemResponseDto> UpdateAsync(int userId, int cellarId, int wineVintageId, UpdateCellarItemRequestDto request, CancellationToken ct = default)
    {
        ValidateItemData(request.Quantity, request.PurchaseDate, request.Notes);
        await EnsureCellarOwnedAsync(userId, cellarId, ct);

        var updated = await itemRepository.UpdateAsync(
            cellarId, wineVintageId, request.Quantity, request.PurchaseDate, NormalizeNotes(request.Notes), ct);
        if (!updated)
            throw new NotFoundException($"La cosecha {wineVintageId} no está en la cava {cellarId}.");

        return await GetRowOrThrowAsync(cellarId, wineVintageId, ct);
    }

    public async Task RemoveAsync(int userId, int cellarId, int wineVintageId, CancellationToken ct = default)
    {
        await EnsureCellarOwnedAsync(userId, cellarId, ct);

        var deleted = await itemRepository.DeleteAsync(cellarId, wineVintageId, ct);
        if (!deleted)
            throw new NotFoundException($"La cosecha {wineVintageId} no está en la cava {cellarId}.");
    }

    public Task<CellarItemResponseDto> UncorkAsync(int userId, int cellarId, int wineVintageId, CancellationToken ct = default) =>
        UncorkAsync(userId, cellarId, wineVintageId, null, ct);

    public async Task<CellarItemResponseDto> UncorkAsync(int userId, int cellarId, int wineVintageId, UncorkCellarItemRequestDto? request, CancellationToken ct = default)
    {
        if (request?.Rating.HasValue == true && (request.Rating.Value is < 1 or > 5))
            throw new ValidationException("El rating debe estar entre 1 y 5.");

        if (request?.Comment?.Length > 1000)
            throw new ValidationException("El comentario no puede superar los 1000 caracteres.");

        await EnsureCellarOwnedAsync(userId, cellarId, ct);

        var row = (request?.Rating.HasValue == true || !string.IsNullOrWhiteSpace(request?.Comment))
            ? await itemRepository.UncorkAsync(userId, cellarId, wineVintageId, request?.Rating, request?.Comment, ct)
            : await itemRepository.UncorkAsync(userId, cellarId, wineVintageId, ct);
        if (row is null)
            throw new ConflictException("No quedan botellas de esta cosecha en la cava o el ítem no existe.");

        return row.ToResponseDto();
    }

    // Si la cava no existe o es de otro usuario: 404, sin revelar cuál de los dos casos es.
    private async Task EnsureCellarOwnedAsync(int userId, int cellarId, CancellationToken ct)
    {
        _ = await cellarRepository.GetByIdAsync(cellarId, userId, ct)
            ?? throw new NotFoundException($"Cava con ID {cellarId} no encontrada.");
    }

    private async Task<CellarItemResponseDto> GetRowOrThrowAsync(int cellarId, int wineVintageId, CancellationToken ct)
    {
        var row = await itemRepository.GetRowAsync(cellarId, wineVintageId, ct)
            ?? throw new NotFoundException($"La cosecha {wineVintageId} no está en la cava {cellarId}.");
        return row.ToResponseDto();
    }

    private static void ValidateItemData(int quantity, DateOnly? purchaseDate, string? notes)
    {
        if (quantity is < 1 or > MaxQuantity)
            throw new ValidationException($"La cantidad debe estar entre 1 y {MaxQuantity}.");

        if (purchaseDate is not null && purchaseDate > DateOnly.FromDateTime(DateTime.UtcNow))
            throw new ValidationException("La fecha de compra no puede ser futura.");

        if (notes is not null && notes.Trim().Length > MaxNotesLength)
            throw new ValidationException($"Las notas no pueden superar los {MaxNotesLength} caracteres.");
    }

    private static string? NormalizeNotes(string? notes)
    {
        var trimmed = notes?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }

    private static string? FormatCombinedNotes(string? location, string? notes)
    {
        var loc = location?.Trim();
        var n = NormalizeNotes(notes);

        if (!string.IsNullOrEmpty(loc) && !string.IsNullOrEmpty(n))
        {
            var combined = $"[{loc}] {n}";
            return combined.Length > MaxNotesLength ? combined[..MaxNotesLength] : combined;
        }
        if (!string.IsNullOrEmpty(loc))
        {
            return $"[{loc}]";
        }
        return n;
    }

    private static void ValidatePaging(int pageNumber, int pageSize)
    {
        if (pageNumber <= 0) throw new ValidationException("pageNumber debe ser mayor a 0.");
        if (pageSize is < 1 or > 100) throw new ValidationException("pageSize debe estar entre 1 y 100.");
    }
}