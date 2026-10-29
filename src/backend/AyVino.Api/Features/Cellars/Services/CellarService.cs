using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Repositories;

namespace AyVino.Api.Features.Cellars.Services;

public class CellarService(ICellarRepository cellarRepository) : ICellarService
{
    private const int MaxNameLength = 100;

    public async Task<IReadOnlyList<CellarResponseDto>> GetAllByUserAsync(int userId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        ValidatePaging(pageNumber, pageSize);

        var rows = await cellarRepository.GetAllByUserAsync(userId, pageNumber, pageSize, ct);
        return rows.ToResponseDtoList();
    }

    public async Task<CellarResponseDto> GetByIdAsync(int userId, int cellarId, CancellationToken ct = default)
    {
        var row = await cellarRepository.GetSummaryByIdAsync(cellarId, userId, ct)
            ?? throw new NotFoundException($"Cava con ID {cellarId} no encontrada.");
        return row.ToResponseDto();
    }

    public async Task<CellarResponseDto> CreateAsync(int userId, CreateCellarRequestDto request, CancellationToken ct = default)
    {
        var name = NormalizeName(request.Name);

        if (await cellarRepository.ExistsByNameAsync(userId, name, null, ct))
            throw new ConflictException($"Ya tenés una cava llamada '{name}'.");

        var id = await cellarRepository.CreateAsync(userId, name, ct);
        return await GetByIdAsync(userId, id, ct);
    }

    public async Task<CellarResponseDto> RenameAsync(int userId, int cellarId, UpdateCellarRequestDto request, CancellationToken ct = default)
    {
        var name = NormalizeName(request.Name);

        _ = await cellarRepository.GetByIdAsync(cellarId, userId, ct)
            ?? throw new NotFoundException($"Cava con ID {cellarId} no encontrada.");

        if (await cellarRepository.ExistsByNameAsync(userId, name, cellarId, ct))
            throw new ConflictException($"Ya tenés una cava llamada '{name}'.");

        var updated = await cellarRepository.UpdateNameAsync(cellarId, userId, name, ct);
        if (!updated) throw new NotFoundException($"Cava con ID {cellarId} no encontrada.");

        return await GetByIdAsync(userId, cellarId, ct);
    }

    public async Task DeleteAsync(int userId, int cellarId, CancellationToken ct = default)
    {
        _ = await cellarRepository.GetByIdAsync(cellarId, userId, ct)
            ?? throw new NotFoundException($"Cava con ID {cellarId} no encontrada.");

        if (await cellarRepository.HasItemsAsync(cellarId, ct))
            throw new ConflictException("La cava todavía tiene botellas. Vaciala antes de borrarla.");

        var deleted = await cellarRepository.DeleteAsync(cellarId, userId, ct);
        if (!deleted) throw new NotFoundException($"Cava con ID {cellarId} no encontrada.");
    }

    private static string NormalizeName(string? name)
    {
        var trimmed = name?.Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new ValidationException("El nombre de la cava es obligatorio.");
        if (trimmed.Length > MaxNameLength)
            throw new ValidationException($"El nombre no puede superar los {MaxNameLength} caracteres.");
        return trimmed;
    }

    private static void ValidatePaging(int pageNumber, int pageSize)
    {
        if (pageNumber <= 0) throw new ValidationException("pageNumber debe ser mayor a 0.");
        if (pageSize is < 1 or > 100) throw new ValidationException("pageSize debe estar entre 1 y 100.");
    }
}