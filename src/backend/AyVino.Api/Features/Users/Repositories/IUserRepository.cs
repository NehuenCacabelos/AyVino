using AyVino.Api.Features.Users.Models;

namespace AyVino.Api.Features.Users.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default);
    Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default);
    Task<(User? User, UserCredential? Credential)> GetUserWithCredentialsByEmailAsync(string email, CancellationToken ct = default);
    Task<int> CreateUserWithCredentialsAsync(User user, UserCredential credential, CancellationToken ct = default);
    Task<bool> UpdateProfileAsync(int id, string username, string? bio, string? photo, CancellationToken ct = default);
    Task<bool> SetIsActiveAsync(int id, bool isActive, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default);
    Task<bool> ExistsByUsernameAsync(string username, CancellationToken ct = default);
    Task<UserCredential?> GetUserCredentialsByIdAsync(int userId, CancellationToken ct = default);
    Task<bool> UpdatePasswordAsync(int userId, string passwordHash, DateTime lastPasswordChange, CancellationToken ct = default);
}   
