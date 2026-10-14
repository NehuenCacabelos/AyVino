using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Repositories;

namespace AyVino.Api.Features.Cellars.Services;

public class CellarItemService(
    ICellarRepository cellarRepository,
    ICellarItemRepository itemRepository,
    IWineVintageRepository wineVintageRepository) : ICellarItemService
{
    private const int MaxQuantity = 999;
    private const int MaxNotesLength = 500;

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

    private static void ValidatePaging(int pageNumber, int pageSize)
    {
        if (pageNumber <= 0) throw new ValidationException("pageNumber debe ser mayor a 0.");
        if (pageSize is < 1 or > 100) throw new ValidationException("pageSize debe estar entre 1 y 100.");
    }
}