using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Ubicaciones.DTOs;
using AyVino.Api.Features.Ubicaciones.Repositories;

namespace AyVino.Api.Features.Ubicaciones.Services;

public class UbicacionService(IUbicacionRepository ubicacionRepository) : IUbicacionService
{
    public async Task<UbicacionResponseDto> CreateAsync(CreateUbicacionRequestDto dto, CancellationToken ct = default)
    {
        ValidateRequest(dto.Pais, dto.Provincia, dto.Ciudad);

        var ubicacion = dto.ToEntity();
        var generatedId = await ubicacionRepository.CreateAsync(ubicacion, ct);
        var created = ubicacion with { Id = generatedId };

        return created.ToResponseDto();
    }

    public async Task<UbicacionResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        if (id <= 0)
        {
            throw new NotFoundException($"Ubicación con ID {id} no encontrada.");
        }

        var ubicacion = await ubicacionRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Ubicación con ID {id} no encontrada.");

        return ubicacion.ToResponseDto();
    }

    public async Task<IEnumerable<UbicacionResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? pais, CancellationToken ct = default)
    {
        if (pageNumber <= 0)
        {
            throw new ValidationException("El número de página debe ser mayor a 0.");
        }

        if (pageSize <= 0 || pageSize > 100)
        {
            throw new ValidationException("El tamaño de página debe estar entre 1 y 100.");
        }

        var ubicaciones = await ubicacionRepository.GetAllAsync(pageNumber, pageSize, pais?.Trim(), ct);
        return ubicaciones.ToResponseDtoList();
    }

    public async Task<UbicacionResponseDto> UpdateAsync(int id, UpdateUbicacionRequestDto dto, CancellationToken ct = default)
    {
        if (id <= 0)
        {
            throw new NotFoundException($"Ubicación con ID {id} no encontrada.");
        }

        ValidateRequest(dto.Pais, dto.Provincia, dto.Ciudad);

        var existing = await ubicacionRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Ubicación con ID {id} no encontrada.");

        var updated = existing with
        {
            Pais = dto.Pais.Trim(),
            Provincia = dto.Provincia?.Trim(),
            Ciudad = dto.Ciudad?.Trim()
        };

        var wasUpdated = await ubicacionRepository.UpdateAsync(updated, ct);
        if (!wasUpdated)
        {
            throw new NotFoundException($"Ubicación con ID {id} no encontrada.");
        }

        return updated.ToResponseDto();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        if (id <= 0)
        {
            throw new NotFoundException($"Ubicación con ID {id} no encontrada.");
        }

        var deleted = await ubicacionRepository.DeleteAsync(id, ct);
        if (!deleted)
        {
            throw new NotFoundException($"Ubicación con ID {id} no encontrada.");
        }
    }

    private static void ValidateRequest(string pais, string? provincia, string? ciudad)
    {
        if (string.IsNullOrWhiteSpace(pais))
        {
            throw new ValidationException("El país es obligatorio.");
        }

        if (pais.Trim().Length > 100)
        {
            throw new ValidationException("El país no puede superar los 100 caracteres.");
        }
    }
}