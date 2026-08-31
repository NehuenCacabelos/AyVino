using AyVino.Api.Features.Auth.DTOs;

namespace AyVino.Api.Features.Auth.Services;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request, string? ipAddress, CancellationToken ct = default);
    Task<RefreshResponseDto> RefreshAsync(RefreshRequestDto request, string? ipAddress, CancellationToken ct = default);
    Task RevokeAsync(RevokeTokenRequestDto request, string? ipAddress, CancellationToken ct = default);
    Task ChangePasswordAsync(int userId, ChangePasswordRequestDto request, CancellationToken ct = default);
}

