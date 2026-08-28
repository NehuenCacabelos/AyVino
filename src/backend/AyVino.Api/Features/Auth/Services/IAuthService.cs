using AyVino.Api.Features.Auth.DTOs;

namespace AyVino.Api.Features.Auth.Services;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken ct = default);
}

