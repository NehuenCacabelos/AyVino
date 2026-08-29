using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Uvas.DTOs;
using AyVino.Api.Features.Uvas.Repositories;
using AyVino.Api.Features.Uvas.Enums;


namespace AyVino.Api.Features.Uvas.Services;

public class UvaService(IUvaRepository uvaRepository) : IUvaService
{
    public async Task<UvaResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var uva = await uvaRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Uva con ID {id} no encontrada.");
        return uva.ToResponseDto();
    }

public async Task<IEnumerable<UvaResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? tipoColor, CancellationToken ct = default)
{
    ValidatePagination(pageNumber, pageSize);

    int? tipoColorValue = null;
    if (!string.IsNullOrWhiteSpace(tipoColor))
    {
        if (!Enum.TryParse<TipoColor>(tipoColor, ignoreCase: true, out var parsedColor))
            throw new ValidationException($"Tipo de color inválido: '{tipoColor}'.");

        tipoColorValue = (int)parsedColor;
    }

    var uvas = await uvaRepository.GetAllAsync(pageNumber, pageSize, tipoColorValue, ct);
    return uvas.ToResponseDtoList();
}

    public async Task<UvaResponseDto> CreateAsync(CreateUvaRequestDto request, CancellationToken ct = default)
    {
        ValidateRequest(request.Nombre);
        var uva = request.ToEntity();
        var id = await uvaRepository.CreateAsync(uva, ct);
        return (uva with { Id = id }).ToResponseDto();
    }

    public async Task<UvaResponseDto> UpdateAsync(int id, UpdateUvaRequestDto request, CancellationToken ct = default)
    {
        ValidateRequest(request.Nombre);
        var existing = await uvaRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Uva con ID {id} no encontrada.");

        var updated = existing with
        {
            Nombre = request.Nombre,
            TipoColor = request.TipoColor,
            CuerpoTipico = request.CuerpoTipico,
            TaninosTipico = request.TaninosTipico,
            AcidezTipica = request.AcidezTipica,
            Descripcion = request.Descripcion
        };

        var success = await uvaRepository.UpdateAsync(updated, ct);
        if (!success) throw new NotFoundException($"Uva con ID {id} no encontrada.");

        return updated.ToResponseDto();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var success = await uvaRepository.DeleteAsync(id, ct);
        if (!success) throw new NotFoundException($"Uva con ID {id} no encontrada.");
    }

    private static void ValidatePagination(int pageNumber, int pageSize)
    {
        if (pageNumber <= 0) throw new ValidationException("El número de página debe ser mayor a 0.");
        if (pageSize is <= 0 or > 100) throw new ValidationException("El tamaño de página debe estar entre 1 y 100.");
    }

    private static void ValidateRequest(string nombre)
    {
        if (string.IsNullOrWhiteSpace(nombre)) throw new ValidationException("El nombre de la uva es obligatorio.");
        if (nombre.Length > 100) throw new ValidationException("El nombre no puede superar los 100 caracteres.");
    }
}