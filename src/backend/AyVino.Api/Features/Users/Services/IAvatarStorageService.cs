using Microsoft.AspNetCore.Http;

namespace AyVino.Api.Features.Users.Services;

public interface IAvatarStorageService
{
    Task<string> SaveAvatarAsync(int userId, IFormFile file, CancellationToken ct = default);
    Task DeleteAvatarAsync(string? photoUrl, CancellationToken ct = default);
}

