using System.Data;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Models;

namespace AyVino.Api.Features.Users.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default);
    Task<PublicUserProfileDto?> GetPublicProfileByUsernameAsync(string username, CancellationToken ct = default);
    Task<IEnumerable<User>> GetAllAsync(int pageNumber, int pageSize, CancellationToken ct = default);
    Task<(User? User, UserCredential? Credential)> GetUserWithCredentialsByEmailAsync(string email, CancellationToken ct = default);
    Task<int> CreateUserWithCredentialsAsync(User user, UserCredential credential, CancellationToken ct = default);
    Task<bool> UpdateProfileAsync(int id, string username, string? bio, CancellationToken ct = default);
    Task<bool> UpdateAvatarImageIdAsync(int userId, Guid? avatarImageId, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default) => Task.FromResult(true);
    Task<bool> UpdateAvatarImageIdAsync(int userId, Guid? avatarImageId, CancellationToken ct = default) => Task.FromResult(true);
    Task<bool> SetIsActiveAsync(int id, bool isActive, CancellationToken ct = default);
    Task<bool> SetRoleAsync(int id, string role, CancellationToken ct = default) => Task.FromResult(true);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default);
    Task<bool> ExistsByUsernameAsync(string username, CancellationToken ct = default);
    Task<UserCredential?> GetUserCredentialsByIdAsync(int userId, CancellationToken ct = default);
    Task<bool> UpdatePasswordAsync(int userId, string passwordHash, DateTime lastPasswordChange, CancellationToken ct = default);
    Task RegisterFailedLoginAsync(int userId, int maxAttempts, DateTime nowUtc, DateTime blockedUntilUtc, CancellationToken ct = default);
    Task ResetFailedLoginAttemptsAsync(int userId, CancellationToken ct = default);
}
