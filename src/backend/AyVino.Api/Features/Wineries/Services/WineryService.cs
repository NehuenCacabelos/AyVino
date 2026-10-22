using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Common.Security.Jwt;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Locations.Services;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Models;
using AyVino.Api.Features.Users.Services;
using AyVino.Api.Features.Wineries.DTOs;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Wineries.Rules;

namespace AyVino.Api.Features.Wineries.Services;

public class WineryService(
    IWineryRepository wineryRepository,
    ILocationRepository locationRepository,
    ICityRepository cityRepository,
    IGeorefClient georefClient,
    IUserService userService,
    IJwtTokenGenerator jwtTokenGenerator,
    IImageStorage? imageStorage = null) : IWineryService
{
    // Constructor de compatibilidad para tests existentes
    public WineryService(
        IWineryRepository wineryRepository,
        ILocationRepository locationRepository,
        IUserService userService,
        IJwtTokenGenerator jwtTokenGenerator)
        : this(wineryRepository, locationRepository, null!, null!, userService, jwtTokenGenerator, null)
    {
    }

    public async Task<WineryResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        if (id <= 0) throw new NotFoundException($"Winery with ID {id} not found.");
        var winery = await wineryRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Winery with ID {id} not found.");
        return winery.ToResponseDto();
    }

    public async Task<WineryResponseDto> GetByUserIdAsync(int userId, CancellationToken ct = default)
    {
        if (userId <= 0) throw new NotFoundException($"Winery for user {userId} not found.");
        var winery = await wineryRepository.GetByUserIdAsync(userId, ct)
            ?? throw new NotFoundException($"Winery for user {userId} not found.");
        return winery.ToResponseDto();
    }

    public async Task<IEnumerable<WineryResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? status = null, int? locationId = null, CancellationToken ct = default)
    {
        if (pageNumber <= 0) throw new ValidationException("pageNumber debe ser mayor a 0.");
        if (pageSize is <= 0 or > 100) throw new ValidationException("pageSize debe estar entre 1 y 100.");

        int? statusValue = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<WineryStatus>(status, ignoreCase: true, out var parsedStatus))
                throw new ValidationException($"Invalid status: '{status}'.");
            statusValue = (int)parsedStatus;
        }

        var wineries = await wineryRepository.GetAllAsync(pageNumber, pageSize, statusValue, locationId, ct);
        return wineries.ToResponseDtoList();
    }

    public async Task<WineryResponseDto> CreateAsync(CreateWineryRequestDto dto, CancellationToken ct = default)
    {
        ValidateName(dto.Name);
        var (locationId, latitude, longitude) = await ResolveLocationChoiceAsync(dto.LocationId, dto.Latitude, dto.Longitude, isRequired: true, ct);

        var winery = dto.ToEntity(locationId, latitude, longitude, userId: null);
        var created = await wineryRepository.CreateAsync(winery, ct);
        var saved = await wineryRepository.GetByIdAsync(created.Id, ct) ?? created;
        return saved.ToResponseDto();
    }

    public async Task<WineryResponseDto> UpdateAsync(int id, UpdateWineryRequestDto dto, Actor actor, CancellationToken ct = default)
    {
        ValidateName(dto.Name);

        var existing = await wineryRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Winery with ID {id} not found.");

        if (!WineryAccessRules.CanManage(existing, actor))
            throw new ForbiddenException(existing.UserId is null
                ? "Solo un administrador puede editar una bodega sin dueño."
                : "No tenés permiso para editar esta bodega.");

        int targetLocationId;
        decimal? targetLatitude;
        decimal? targetLongitude;

        if (dto.LocationId.HasValue || dto.Latitude.HasValue || dto.Longitude.HasValue)
        {
            var resolved = await ResolveLocationChoiceAsync(dto.LocationId, dto.Latitude, dto.Longitude, isRequired: false, ct);
            targetLocationId = resolved.LocationId;
            targetLatitude = resolved.Latitude;
            targetLongitude = resolved.Longitude;
        }
        else
        {
            targetLocationId = existing.LocationId;
            targetLatitude = existing.Latitude;
            targetLongitude = existing.Longitude;
        }

        string? targetLogoUrl;
        if (dto.LogoUrl == null)
        {
            targetLogoUrl = existing.LogoUrl;
        }
        else if (string.IsNullOrWhiteSpace(dto.LogoUrl))
        {
            targetLogoUrl = null;
        }
        else
        {
            var trimmedLogo = dto.LogoUrl.Trim();
            if (imageStorage != null && !imageStorage.IsUrlFromStorage(trimmedLogo))
                throw new ValidationException("La URL del logo debe pertenecer al almacenamiento oficial del sistema.");

            targetLogoUrl = trimmedLogo;
        }

        var winery = existing with
        {
            Name = dto.Name,
            Description = dto.Description,
            LocationId = targetLocationId,
            Latitude = targetLatitude,
            Longitude = targetLongitude,
            FoundationYear = dto.FoundationYear,
            Website = dto.Website,
            LogoUrl = targetLogoUrl
        };

        var updated = await wineryRepository.UpdateAsync(winery, ct);
        if (!updated) throw new NotFoundException($"Winery with ID {id} not found.");

        var savedWinery = await wineryRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Winery with ID {id} not found.");
        return savedWinery.ToResponseDto();
    }

    public async Task<WineryResponseDto> ChangeStatusAsync(int id, ChangeWineryStatusRequestDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Status) || !Enum.TryParse<WineryStatus>(dto.Status, ignoreCase: true, out var parsedStatus))
            throw new ValidationException($"Invalid status: '{dto.Status}'.");

        var exists = await wineryRepository.ExistsByIdAsync(id, ct);
        if (!exists) throw new NotFoundException($"Winery with ID {id} not found.");

        var updated = await wineryRepository.UpdateStatusAsync(id, (int)parsedStatus, ct);
        if (!updated) throw new NotFoundException($"Winery with ID {id} not found.");

        var winery = await wineryRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Winery with ID {id} not found.");
        return winery.ToResponseDto();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var deleted = await wineryRepository.DeleteAsync(id, ct);
        if (!deleted) throw new NotFoundException($"Winery with ID {id} not found.");
    }

    public async Task<RegisterWineryResponseDto> RegisterWineryAsync(RegisterWineryRequestDto dto, CancellationToken ct = default)
    {
        ValidateName(dto.WineryName);
        var (locationId, latitude, longitude) = await ResolveLocationChoiceAsync(dto.LocationId, dto.Latitude, dto.Longitude, isRequired: true, ct);

        var createdUser = await userService.RegisterAsync(
            new CreateUserRequestDto(dto.Username, dto.Email, dto.Password, Role: "Winery"), ct);

        WineryResponseDto createdWinery;
        try
        {
            var wineryEntity = new Winery
            {
                Name = dto.WineryName,
                Description = dto.Description,
                LocationId = locationId,
                Latitude = latitude,
                Longitude = longitude,
                FoundationYear = dto.FoundationYear,
                Website = dto.Website,
                UserId = createdUser.Id,
                Status = WineryStatus.Pending,
                RegisterDate = DateTime.UtcNow
            };

            var created = await wineryRepository.CreateAsync(wineryEntity, ct);
            var saved = await wineryRepository.GetByIdAsync(created.Id, ct) ?? created;
            createdWinery = saved.ToResponseDto();
        }
        catch
        {
            // Compensation: avoid leaving an orphaned User if the Winery insert fails
            await userService.DeleteAsync(createdUser.Id, ct);
            throw;
        }

        var userForToken = new User
        {
            Id = createdUser.Id,
            Username = createdUser.Username,
            Email = createdUser.Email,
            Role = createdUser.Role,
            RegisterDate = createdUser.RegisterDate,
            IsActive = createdUser.IsActive,
            Photo = createdUser.Photo,
            Bio = createdUser.Bio
        };

        var (token, expiresAt) = jwtTokenGenerator.GenerateToken(userForToken);

        return new RegisterWineryResponseDto(createdWinery, token, "Bearer", expiresAt);
    }

    private static void ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ValidationException("The winery name is required.");
        if (name.Length > 100)
            throw new ValidationException("The winery name cannot exceed 100 characters.");
    }

    private async Task<(int LocationId, decimal? Latitude, decimal? Longitude)> ResolveLocationChoiceAsync(
        int? locationId, decimal? latitude, decimal? longitude, bool isRequired, CancellationToken ct)
    {
        var hasCoords = latitude.HasValue || longitude.HasValue;
        var hasLocationId = locationId.HasValue;

        if (hasCoords && hasLocationId)
        {
            throw new ValidationException("Debe proporcionar coordenadas geográficas (latitud y longitud) o un id de ubicación, pero no ambos.");
        }

        if (hasCoords)
        {
            if (!latitude.HasValue || !longitude.HasValue)
            {
                throw new ValidationException("Debe proporcionar tanto latitud como longitud.");
            }

            if (georefClient == null || cityRepository == null || locationRepository == null)
            {
                throw new InvalidOperationException("Servicio de geolocalización no configurado.");
            }

            var georef = await georefClient.ResolveLocationAsync(latitude.Value, longitude.Value, ct);
            var city = await cityRepository.GetByGeorefIdAsync(georef.DepartmentId, ct)
                ?? throw new NotFoundException($"No se encontró la región interna para el departamento con código Georef {georef.DepartmentId}.");

            var location = await locationRepository.GetByCityIdAsync(city.Id, ct)
                ?? throw new NotFoundException($"No se encontró el registro de ubicación asociado al departamento {city.Name}.");

            return (location.Id, latitude.Value, longitude.Value);
        }

        if (hasLocationId)
        {
            if (locationId!.Value <= 0)
            {
                throw new ValidationException("El id de la ubicación debe ser mayor a 0.");
            }

            var locationExists = await locationRepository.ExistsByIdAsync(locationId.Value, ct);
            if (!locationExists)
            {
                throw new ValidationException($"Location with ID {locationId.Value} does not exist.");
            }

            return (locationId.Value, null, null);
        }

        if (isRequired)
        {
            throw new ValidationException("La ubicación es obligatoria. Debe proporcionar coordenadas (latitud y longitud) o un id de ubicación.");
        }

        return (0, null, null);
    }
}
