using AyVino.Api.Features.Auth.Models;

namespace AyVino.Api.Features.Auth.Repositories;

public interface IRefreshTokenRepository
{
    Task SaveRefreshTokenAsync(RefreshToken token, CancellationToken ct = default);
    Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken ct = default);
    Task<bool> UpdateRefreshTokenAsync(RefreshToken token, CancellationToken ct = default);
    Task<bool> RevokeRefreshTokenAsync(string token, string? ipAddress, CancellationToken ct = default);
    Task<int> RevokeAllUserTokensAsync(int userId, string? ipAddress, CancellationToken ct = default);
    Task<int> DeleteExpiredAndRevokedTokensAsync(DateTime beforeUtc, CancellationToken ct = default);
}
