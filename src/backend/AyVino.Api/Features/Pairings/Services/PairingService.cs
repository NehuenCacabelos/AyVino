using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Pairings.DTOs;
using AyVino.Api.Features.Pairings.Enums;
using AyVino.Api.Features.Pairings.Repositories;
using AyVino.Api.Features.Wines.Repositories;

namespace AyVino.Api.Features.Pairings.Services;

public class PairingService(
    IPairingRepository pairingRepository,
    IWineRepository wineRepository) : IPairingService
{
    public async Task<PairingResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var pairing = await pairingRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Pairing with ID {id} not found.");
        return pairing.ToResponseDto();
    }

    public async Task<IEnumerable<PairingResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? category, CancellationToken ct = default)
    {
        ValidatePagination(pageNumber, pageSize);

        int? categoryValue = null;
        if (!string.IsNullOrWhiteSpace(category))
        {
            if (!Enum.TryParse<PairingCategory>(category, ignoreCase: true, out var parsedCategory))
                throw new ValidationException($"Invalid category: '{category}'.");

            categoryValue = (int)parsedCategory;
        }

        var pairings = await pairingRepository.GetAllAsync(pageNumber, pageSize, categoryValue, ct);
        return pairings.ToResponseDtoList();
    }

    public async Task<PairingResponseDto> CreateAsync(CreatePairingRequestDto request, CancellationToken ct = default)
    {
        ValidateRequest(request.Name);
        var pairing = request.ToEntity();
        var id = await pairingRepository.CreateAsync(pairing, ct);
        return (pairing with { Id = id }).ToResponseDto();
    }

    public async Task<PairingResponseDto> UpdateAsync(int id, UpdatePairingRequestDto request, CancellationToken ct = default)
    {
        ValidateRequest(request.Name);
        var existing = await pairingRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Pairing with ID {id} not found.");

        var updated = existing with
        {
            Name = request.Name,
            Category = request.Category
        };

        var success = await pairingRepository.UpdateAsync(updated, ct);
        if (!success) throw new NotFoundException($"Pairing with ID {id} not found.");

        return updated.ToResponseDto();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var success = await pairingRepository.DeleteAsync(id, ct);
        if (!success) throw new NotFoundException($"Pairing with ID {id} not found.");
    }

    public async Task<IEnumerable<PairingResponseDto>> GetByWineIdAsync(int wineId, CancellationToken ct = default)
    {
        if (!await wineRepository.ExistsByIdAsync(wineId, ct))
            throw new NotFoundException($"Wine with ID {wineId} not found.");

        var pairings = await pairingRepository.GetByWineIdAsync(wineId, ct);
        return pairings.ToResponseDtoList();
    }

    public async Task AddToWineAsync(int wineId, int pairingId, CancellationToken ct = default)
    {
        if (!await wineRepository.ExistsByIdAsync(wineId, ct))
            throw new NotFoundException($"Wine with ID {wineId} not found.");

        if (!await pairingRepository.ExistsByIdAsync(pairingId, ct))
            throw new NotFoundException($"Pairing with ID {pairingId} not found.");

        if (await pairingRepository.IsAssociatedAsync(wineId, pairingId, ct))
            throw new ConflictException($"Pairing {pairingId} is already associated with wine {wineId}.");

        await pairingRepository.AddToWineAsync(wineId, pairingId, ct);
    }

    public async Task RemoveFromWineAsync(int wineId, int pairingId, CancellationToken ct = default)
    {
        var removed = await pairingRepository.RemoveFromWineAsync(wineId, pairingId, ct);
        if (!removed) throw new NotFoundException($"Wine {wineId} is not paired with pairing {pairingId}.");
    }

    private static void ValidatePagination(int pageNumber, int pageSize)
    {
        if (pageNumber <= 0) throw new ValidationException("Page number must be greater than 0.");
        if (pageSize is <= 0 or > 100) throw new ValidationException("Page size must be between 1 and 100.");
    }

    private static void ValidateRequest(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ValidationException("Pairing name is required.");
        if (name.Length > 100) throw new ValidationException("Name cannot exceed 100 characters.");
    }
}