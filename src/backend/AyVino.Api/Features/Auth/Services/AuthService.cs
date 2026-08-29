using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Auth.DTOs;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Repositories;

namespace AyVino.Api.Features.Auth.Services;

public class AuthService(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    IJwtTokenGenerator jwtTokenGenerator) : IAuthService
{
    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken ct = default)
    {
        if (request is null)
        {
            throw new ValidationException("La solicitud de inicio de sesión no puede ser nula.");
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ValidationException("El correo electrónico es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ValidationException("La contraseña es obligatoria.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var (user, credential) = await userRepository.GetUserWithCredentialsByEmailAsync(normalizedEmail, ct);

        // Mitigación de timing attacks: si el usuario o credencial no existen, ejecutamos hash ficticio
        if (user is null || credential is null)
        {
            passwordHasher.VerifyPassword(request.Password, passwordHasher.DummyHash);
            throw new UnauthorizedException("Credenciales inválidas.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedException("La cuenta se encuentra desactivada.");
        }

        if (credential.BlockedUntil.HasValue && credential.BlockedUntil.Value > DateTime.UtcNow)
        {
            throw new UnauthorizedException($"La cuenta se encuentra temporalmente bloqueada hasta {credential.BlockedUntil.Value:yyyy-MM-dd HH:mm:ss} UTC.");
        }

        var isPasswordValid = passwordHasher.VerifyPassword(request.Password, credential.PasswordHash);
        if (!isPasswordValid)
        {
            throw new UnauthorizedException("Credenciales inválidas.");
        }

        var (token, expiresAt) = jwtTokenGenerator.GenerateToken(user);
        return new AuthResponseDto(token, "Bearer", expiresAt, user.ToResponseDto());
    }
}

