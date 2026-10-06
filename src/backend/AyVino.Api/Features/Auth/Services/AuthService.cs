using System.Security.Cryptography;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security.Hashing;
using AyVino.Api.Common.Security.Jwt;
using AyVino.Api.Features.Auth.DTOs;
using AyVino.Api.Features.Auth.Models;
using AyVino.Api.Features.Auth.Repositories;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Repositories;
using Microsoft.Extensions.Options;

namespace AyVino.Api.Features.Auth.Services;

public class AuthService(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    IJwtTokenGenerator jwtTokenGenerator,
    IRefreshTokenRepository refreshTokenRepository,
    IOptions<JwtSettings> jwtSettings) : IAuthService
{
    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request, string? ipAddress, CancellationToken ct = default)
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
        var refreshTokenString = GenerateSecureRefreshToken();
        var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(jwtSettings.Value.RefreshTokenExpirationDays);

        var refreshToken = new RefreshToken
        {
            Token = refreshTokenString,
            UserId = user.Id,
            ExpiresAt = refreshTokenExpiresAt,
            CreatedByIp = ipAddress
        };

        await refreshTokenRepository.SaveRefreshTokenAsync(refreshToken, ct);

        return new LoginResponseDto(token, refreshTokenString, "Bearer", expiresAt, user.ToResponseDto());
    }

    public async Task<RefreshResponseDto> RefreshAsync(RefreshRequestDto request, string? ipAddress, CancellationToken ct = default)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw new ValidationException("El token de refresco es obligatorio.");
        }

        var oldRefreshToken = await refreshTokenRepository.GetByTokenAsync(request.RefreshToken, ct);
        if (oldRefreshToken is null)
        {
            throw new UnauthorizedException("Sesión inválida o expirada.");
        }

        // Detección de Reutilización / Robo de Token
        if (oldRefreshToken.IsRevoked || oldRefreshToken.ReplacedByToken != null)
        {
            // El token ya fue usado o revocado. Revocamos todos los tokens del usuario.
            await refreshTokenRepository.RevokeAllUserTokensAsync(oldRefreshToken.UserId, ipAddress, ct);
            throw new UnauthorizedException("Sesión inválida o expirada.");
        }

        if (oldRefreshToken.IsExpired)
        {
            throw new UnauthorizedException("Sesión inválida o expirada.");
        }

        var user = await userRepository.GetByIdAsync(oldRefreshToken.UserId, ct);
        if (user is null || !user.IsActive)
        {
            throw new UnauthorizedException("Sesión inválida o expirada.");
        }

        // Generar nuevos tokens
        var (newAccessToken, expiresAt) = jwtTokenGenerator.GenerateToken(user);
        var newRefreshTokenString = GenerateSecureRefreshToken();
        var newRefreshTokenExpiresAt = DateTime.UtcNow.AddDays(jwtSettings.Value.RefreshTokenExpirationDays);

        var newRefreshToken = new RefreshToken
        {
            Token = newRefreshTokenString,
            UserId = user.Id,
            ExpiresAt = newRefreshTokenExpiresAt,
            CreatedByIp = ipAddress
        };

        await refreshTokenRepository.SaveRefreshTokenAsync(newRefreshToken, ct);

        // Rotación: marcar el anterior como revocado y enlazado al nuevo
        var updatedOldToken = oldRefreshToken with
        {
            RevokedAt = DateTime.UtcNow,
            RevokedByIp = ipAddress,
            ReplacedByToken = newRefreshTokenString
        };
        await refreshTokenRepository.UpdateRefreshTokenAsync(updatedOldToken, ct);

        return new RefreshResponseDto(newAccessToken, newRefreshTokenString, "Bearer", expiresAt);
    }

    public async Task RevokeAsync(RevokeTokenRequestDto request, string? ipAddress, CancellationToken ct = default)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw new ValidationException("El token de refresco es obligatorio.");
        }

        await refreshTokenRepository.RevokeRefreshTokenAsync(request.RefreshToken, ipAddress, ct);
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequestDto request, CancellationToken ct = default)
    {
        if(request is null){
            throw new ValidationException("La solicitud de cambio de contraseña no puede ser nula.");
        }

        if(string.IsNullOrWhiteSpace(request.CurrentPassword)){
            throw new ValidationException("La contraseña actual es obligatoria.");
        }

        if(string.IsNullOrWhiteSpace(request.NewPassword)){
            throw new ValidationException("La nueva contraseña es obligatoria.");
        }

        if(request.CurrentPassword == request.NewPassword){
            throw new ValidationException("La nueva contraseña debe ser diferente a la contraseña actual.");
        }

        if(request.NewPassword.Length < 6){
            throw new ValidationException("La nueva contraseña debe tener al menos 6 caracteres.");
        }

        if(request.NewPassword.Length > 128){
            throw new ValidationException("La nueva contraseña debe tener menos de 128 caracteres.");
        }
        
        var credentials = await userRepository.GetUserCredentialsByIdAsync(userId, ct)
            ?? throw new UnauthorizedException("Credenciales inválidas.");

        var isPasswordValid = passwordHasher.VerifyPassword(request.CurrentPassword, credentials.PasswordHash);
        if(!isPasswordValid){
            throw new UnauthorizedException("Credenciales inválidas.");
        }

        var newPasswordHash = passwordHasher.HashPassword(request.NewPassword);

        var update = await userRepository.UpdatePasswordAsync(userId, newPasswordHash,DateTime.UtcNow,ct);
        
        if(!update){
            throw new InvalidOperationException("No fue posible actualizar la contraseña.");
        }
    }

    private string GenerateSecureRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}

