using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Bodegas.DTOs;
using AyVino.Api.Features.Bodegas.Enums;
using AyVino.Api.Features.Bodegas.Repositories;
using AyVino.Api.Features.Ubicaciones.Repositories;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Services;

namespace AyVino.Api.Features.Bodegas.Services;

public class BodegaService(
    IBodegaRepository bodegaRepository,
    IUbicacionRepository ubicacionRepository,
    IUserService userService) : IBodegaService
{
    public async Task<BodegaResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        if (id <= 0) throw new NotFoundException($"Bodega con ID {id} no encontrada.");
        var bodega = await bodegaRepository.GetByIdAsync(id, ct) ?? throw new NotFoundException($"Bodega con ID {id} no encontrada.");
        return bodega.ToResponseDto();
    }

    public async Task<IEnumerable<BodegaResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? estado = null, int? ubicacionId = null, CancellationToken ct = default)
    {
        if (pageNumber <= 0) throw new ValidationException("El número de página debe ser mayor a 0.");
        if (pageSize is <= 0 or > 100) throw new ValidationException("El tamaño de página debe estar entre 1 y 100.");

        int? estadoValue = null;
        if (!string.IsNullOrWhiteSpace(estado))
        {
            if (!Enum.TryParse<EstadoBodega>(estado, ignoreCase: true, out var parsedEstado))
                throw new ValidationException($"Estado inválido: '{estado}'.");
            estadoValue = (int)parsedEstado;
        }

        var bodegas = await bodegaRepository.GetAllAsync(pageNumber, pageSize, estadoValue, ubicacionId, ct);
        return bodegas.ToResponseDtoList();
    }

    public async Task<BodegaResponseDto> CreateAsync(CreateBodegaRequestDto dto, CancellationToken ct = default)
    {
        await ValidateRequestAsync(dto.Nombre, dto.UbicacionId, ct);
        var bodega = await bodegaRepository.CreateAsync(usuarioId: null, dto, ct);
        return bodega.ToResponseDto();
    }

    public async Task<BodegaResponseDto> UpdateAsync(int id, UpdateBodegaRequestDto dto, CancellationToken ct = default)
    {
        await ValidateRequestAsync(dto.Nombre, dto.UbicacionId, ct);

        var exists = await bodegaRepository.ExistsByIdAsync(id, ct);
        if (!exists) throw new NotFoundException($"Bodega con ID {id} no encontrada.");

        var updated = await bodegaRepository.UpdateAsync(id, dto, ct);
        if (!updated) throw new NotFoundException($"Bodega con ID {id} no encontrada.");

        var bodega = await bodegaRepository.GetByIdAsync(id, ct) ?? throw new NotFoundException($"Bodega con ID {id} no encontrada.");
        return bodega.ToResponseDto();
    }

    public async Task<BodegaResponseDto> CambiarEstadoAsync(int id, string estado, CancellationToken ct = default)
    {
        if (!Enum.TryParse<EstadoBodega>(estado, ignoreCase: true, out var parsedEstado))
            throw new ValidationException($"Estado inválido: '{estado}'.");

        var exists = await bodegaRepository.ExistsByIdAsync(id, ct);
        if (!exists) throw new NotFoundException($"Bodega con ID {id} no encontrada.");

        var updated = await bodegaRepository.UpdateEstadoAsync(id, (int)parsedEstado, ct);
        if (!updated) throw new NotFoundException($"Bodega con ID {id} no encontrada.");

        var bodega = await bodegaRepository.GetByIdAsync(id, ct) ?? throw new NotFoundException($"Bodega con ID {id} no encontrada.");
        return bodega.ToResponseDto();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var deleted = await bodegaRepository.DeleteAsync(id, ct);
        if (!deleted) throw new NotFoundException($"Bodega con ID {id} no encontrada.");
    }

    public async Task<RegistrarBodegaResponseDto> RegistrarBodegaAsync(RegistrarBodegaRequestDto dto, CancellationToken ct = default)
    {
        var bodegaDto = dto.ToCreateBodegaRequestDto();
        await ValidateRequestAsync(bodegaDto.Nombre, bodegaDto.UbicacionId, ct);

        var usuarioCreado = await userService.RegisterAsync(
            new CreateUserRequestDto(dto.NombreUsuario, dto.Email, dto.Password, Rol: "Bodega"), ct);

        BodegaResponseDto bodegaCreada;
        try
        {
            var bodega = await bodegaRepository.CreateAsync(usuarioCreado.Id, bodegaDto, ct);
            bodegaCreada = bodega.ToResponseDto();
        }
        catch
        {
            // Compensación: evita dejar un Usuario huérfano si falla el insert de Bodega
            await userService.DeleteAsync(usuarioCreado.Id, ct);
            throw;
        }

        // cuando exista el módulo de Auth inyectar el servicio de tokens
        // acá y generar el JWT para loguear automáticamente. Por ahora Token queda null.
        string? token = null;

        return new RegistrarBodegaResponseDto(bodegaCreada, token);
    }

    private async Task ValidateRequestAsync(string nombre, int ubicacionId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ValidationException("El nombre de la bodega es obligatorio.");
        if (nombre.Length > 100)
            throw new ValidationException("El nombre de la bodega no puede superar los 100 caracteres.");

        var ubicacionExiste = await ubicacionRepository.ExistsByIdAsync(ubicacionId, ct);
        if (!ubicacionExiste)
            throw new ValidationException($"La ubicación con ID {ubicacionId} no existe.");
    }
}