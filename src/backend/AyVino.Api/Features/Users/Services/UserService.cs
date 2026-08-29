using System.Text.RegularExpressions;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security.Hashing;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Repositories;

namespace AyVino.Api.Features.Users.Services;

public partial class UserService(IUserRepository userRepository, IPasswordHasher passwordHasher) : IUserService
{
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Admin",
        "Bodega",
        "User"
    };

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex EmailRegex();

    public async Task<UserResponseDto> RegisterAsync(CreateUserRequestDto dto, CancellationToken ct = default)
    {
        ValidateCreateUserRequest(dto);

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var normalizedUsername = dto.Username.Trim();

        if (await userRepository.ExistsByEmailAsync(normalizedEmail, ct))
        {
            throw new ConflictException($"El correo electrónico '{dto.Email}' ya se encuentra registrado.");
        }

        if (await userRepository.ExistsByUsernameAsync(normalizedUsername, ct))
        {
            throw new ConflictException($"El nombre de usuario '{dto.Username}' ya está en uso.");
        }

        var userEntity = dto.ToEntity();
        var passwordHash = passwordHasher.HashPassword(dto.Password);
        
        // El id inicial es 0, el repositorio asignará el Id generado dentro de la transacción
        var credentialEntity = dto.ToCredentialEntity(0, passwordHash);

        var generatedId = await userRepository.CreateUserWithCredentialsAsync(userEntity, credentialEntity, ct);
        var createdUser = userEntity with { Id = generatedId };

        return createdUser.ToResponseDto();
    }

    public async Task<UserResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        if (id <= 0)
        {
            throw new NotFoundException($"Usuario con ID {id} no encontrado.");
        }

        var user = await userRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Usuario con ID {id} no encontrado.");

        return user.ToResponseDto();
    }

    public async Task<UserResponseDto> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new NotFoundException($"Usuario con email '{email}' no encontrado.");
        }

        var user = await userRepository.GetByEmailAsync(email.Trim(), ct)
            ?? throw new NotFoundException($"Usuario con email '{email}' no encontrado.");

        return user.ToResponseDto();
    }

    public async Task<IEnumerable<UserResponseDto>> GetAllAsync(CancellationToken ct = default)
    {
        var users = await userRepository.GetAllAsync(ct);
        return users.ToResponseDtoList();
    }

    public async Task<UserResponseDto> UpdateProfileAsync(int id, UpdateUserProfileRequestDto dto, CancellationToken ct = default)
    {
        if (id <= 0)
        {
            throw new NotFoundException($"Usuario con ID {id} no encontrado.");
        }

        if (dto is null || string.IsNullOrWhiteSpace(dto.Username))
        {
            throw new ValidationException("El nombre de usuario no puede estar vacío.");
        }

        var existingUser = await userRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Usuario con ID {id} no encontrado.");

        var normalizedUsername = dto.Username.Trim();
        if (!existingUser.Username.Equals(normalizedUsername, StringComparison.OrdinalIgnoreCase)
            && await userRepository.ExistsByUsernameAsync(normalizedUsername, ct))
        {
            throw new ConflictException($"El nombre de usuario '{dto.Username}' ya está en uso.");
        }

        var updated = await userRepository.UpdateProfileAsync(
            id,
            normalizedUsername,
            dto.Bio?.Trim(),
            dto.Photo?.Trim(),
            ct);

        if (!updated)
        {
            throw new NotFoundException($"Usuario con ID {id} no encontrado.");
        }

        var updatedUser = existingUser with
        {
            Username = normalizedUsername,
            Bio = dto.Bio?.Trim(),
            Photo = dto.Photo?.Trim()
        };

        return updatedUser.ToResponseDto();
    }

    public async Task ChangeStatusAsync(int id, bool isActive, CancellationToken ct = default)
    {
        if (id <= 0)
        {
            throw new NotFoundException($"Usuario con ID {id} no encontrado.");
        }

        var exists = await userRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Usuario con ID {id} no encontrado.");

        var updated = await userRepository.SetIsActiveAsync(id, isActive, ct);
        if (!updated)
        {
            throw new NotFoundException($"Usuario con ID {id} no encontrado.");
        }
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        if (id <= 0)
        {
            throw new NotFoundException($"Usuario con ID {id} no encontrado.");
        }

        var deleted = await userRepository.DeleteAsync(id, ct);
        if (!deleted)
        {
            throw new NotFoundException($"Usuario con ID {id} no encontrado.");
        }
    }

    private static void ValidateCreateUserRequest(CreateUserRequestDto dto)
    {
        if (dto is null)
        {
            throw new ValidationException("El cuerpo de la solicitud no puede ser nulo.");
        }

        if (string.IsNullOrWhiteSpace(dto.Username))
        {
            throw new ValidationException("El nombre de usuario es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            throw new ValidationException("El correo electrónico es obligatorio.");
        }

        if (!EmailRegex().IsMatch(dto.Email.Trim()))
        {
            throw new ValidationException("El formato del correo electrónico no es válido.");
        }

        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
        {
            throw new ValidationException("La contraseña debe tener al menos 6 caracteres.");
        }

        var role = string.IsNullOrWhiteSpace(dto.Role) ? "User" : dto.Role.Trim();
        if (!AllowedRoles.Contains(role))
        {
            throw new ValidationException($"El rol '{dto.Role}' no es válido. Roles permitidos: Admin, Bodega, User.");
        }
    }
}
