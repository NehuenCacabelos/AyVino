using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Grapes.DTOs;
using AyVino.Api.Features.Grapes.Enums;
using AyVino.Api.Features.Grapes.Repositories;

namespace AyVino.Api.Features.Grapes.Services;

public class GrapeService(IGrapeRepository grapeRepository) : IGrapeService
{
    public async Task<GrapeResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var grape = await grapeRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Grape with ID {id} not found.");
        return grape.ToResponseDto();
    }

    public async Task<IEnumerable<GrapeResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? colorType, CancellationToken ct = default)
    {
        ValidatePagination(pageNumber, pageSize);

        int? colorTypeValue = null;
        if (!string.IsNullOrWhiteSpace(colorType))
        {
            if (!Enum.TryParse<ColorType>(colorType, ignoreCase: true, out var parsedColor))
                throw new ValidationException($"Invalid color type: '{colorType}'.");

            colorTypeValue = (int)parsedColor;
        }

        var grapes = await grapeRepository.GetAllAsync(pageNumber, pageSize, colorTypeValue, ct);
        return grapes.ToResponseDtoList();
    }

    public async Task<GrapeResponseDto> CreateAsync(CreateGrapeRequestDto request, CancellationToken ct = default)
    {
        ValidateRequest(request.Name);
        var grape = request.ToEntity();
        var id = await grapeRepository.CreateAsync(grape, ct);
        return (grape with { Id = id }).ToResponseDto();
    }

    public async Task<GrapeResponseDto> UpdateAsync(int id, UpdateGrapeRequestDto request, CancellationToken ct = default)
    {
        ValidateRequest(request.Name);
        var existing = await grapeRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Grape with ID {id} not found.");

        var updated = existing with
        {
            Name = request.Name,
            ColorType = request.ColorType,
            TypicalBody = request.TypicalBody,
            TypicalTannins = request.TypicalTannins,
            TypicalAcidity = request.TypicalAcidity,
            Description = request.Description
        };

        var success = await grapeRepository.UpdateAsync(updated, ct);
        if (!success) throw new NotFoundException($"Grape with ID {id} not found.");

        return updated.ToResponseDto();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var success = await grapeRepository.DeleteAsync(id, ct);
        if (!success) throw new NotFoundException($"Grape with ID {id} not found.");
    }

    private static void ValidatePagination(int pageNumber, int pageSize)
    {
        if (pageNumber <= 0) throw new ValidationException("Page number must be greater than 0.");
        if (pageSize is <= 0 or > 100) throw new ValidationException("Page size must be between 1 and 100.");
    }

    private static void ValidateRequest(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ValidationException("Grape name is required.");
        if (name.Length > 100) throw new ValidationException("Name cannot exceed 100 characters.");
    }
}