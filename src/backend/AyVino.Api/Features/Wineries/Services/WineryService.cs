using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Models;
using AyVino.Api.Features.Users.Services;
using AyVino.Api.Features.Wineries.DTOs;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Repositories;

namespace AyVino.Api.Features.Wineries.Services;

public class WineryService(
    IWineryRepository wineryRepository,
    ILocationRepository locationRepository,
    IUserService userService,
    IJwtTokenGenerator jwtTokenGenerator) : IWineryService
{
    public async Task<WineryResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        if (id <= 0) throw new NotFoundException($"Winery with ID {id} not found.");
        var winery = await wineryRepository.GetByIdAsync(id, ct) ?? throw new NotFoundException($"Winery with ID {id} not found.");
        return winery.ToResponseDto();
    }

    public async Task<IEnumerable<WineryResponseDto>> GetAllAsync(int pageNumber, int pageSize, string? status = null, int? locationId = null, CancellationToken ct = default)
    {
        if (pageNumber <= 0) throw new ValidationException("Page number must be greater than 0.");
        if (pageSize is <= 0 or > 100) throw new ValidationException("Page size must be between 1 and 100.");

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
        await ValidateRequestAsync(dto.Name, dto.LocationId, ct);
        var winery = await wineryRepository.CreateAsync(userId: null, dto, ct);
        return winery.ToResponseDto();
    }

    public async Task<WineryResponseDto> UpdateAsync(int id, UpdateWineryRequestDto dto, CancellationToken ct = default)
    {
        await ValidateRequestAsync(dto.Name, dto.LocationId, ct);

        var exists = await wineryRepository.ExistsByIdAsync(id, ct);
        if (!exists) throw new NotFoundException($"Winery with ID {id} not found.");

        var updated = await wineryRepository.UpdateAsync(id, dto, ct);
        if (!updated) throw new NotFoundException($"Winery with ID {id} not found.");

        var winery = await wineryRepository.GetByIdAsync(id, ct) ?? throw new NotFoundException($"Winery with ID {id} not found.");
        return winery.ToResponseDto();
    }

    public async Task<WineryResponseDto> ChangeStatusAsync(int id, string status, CancellationToken ct = default)
    {
        if (!Enum.TryParse<WineryStatus>(status, ignoreCase: true, out var parsedStatus))
            throw new ValidationException($"Invalid status: '{status}'.");

        var exists = await wineryRepository.ExistsByIdAsync(id, ct);
        if (!exists) throw new NotFoundException($"Winery with ID {id} not found.");

        var updated = await wineryRepository.UpdateStatusAsync(id, (int)parsedStatus, ct);
        if (!updated) throw new NotFoundException($"Winery with ID {id} not found.");

        var winery = await wineryRepository.GetByIdAsync(id, ct) ?? throw new NotFoundException($"Winery with ID {id} not found.");
        return winery.ToResponseDto();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var deleted = await wineryRepository.DeleteAsync(id, ct);
        if (!deleted) throw new NotFoundException($"Winery with ID {id} not found.");
    }

    public async Task<RegisterWineryResponseDto> RegisterWineryAsync(RegisterWineryRequestDto dto, CancellationToken ct = default)
    {
        var wineryDto = dto.ToCreateWineryRequestDto();
        await ValidateRequestAsync(wineryDto.Name, wineryDto.LocationId, ct);

        var createdUser = await userService.RegisterAsync(
            new CreateUserRequestDto(dto.Username, dto.Email, dto.Password, Role: "Winery"), ct);

        WineryResponseDto createdWinery;
        try
        {
            var winery = await wineryRepository.CreateAsync(createdUser.Id, wineryDto, ct);
            createdWinery = winery.ToResponseDto();
        }
        catch
        {
            // Compensation: avoid leaving an orphaned User if the Winery insert fails
            await userService.DeleteAsync(createdUser.Id, ct);
            throw;
        }

        // Rebuild the domain User from the DTO (fields map 1:1) to generate the token,
        // without needing an extra IUserRepository dependency here.
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

    private async Task ValidateRequestAsync(string name, int locationId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ValidationException("The winery name is required.");
        if (name.Length > 100)
            throw new ValidationException("The winery name cannot exceed 100 characters.");

        var locationExists = await locationRepository.ExistsByIdAsync(locationId, ct);
        if (!locationExists)
            throw new ValidationException($"Location with ID {locationId} does not exist.");
    }
}