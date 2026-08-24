using AyVino.Api.Features.Users.Models;

namespace AyVino.Api.Features.Users.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> GetByNombreUsuarioAsync(string nombreUsuario, CancellationToken ct = default);
    Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default);
    Task<(User? User, UserCredential? Credential)> GetUserWithCredentialsByEmailAsync(string email, CancellationToken ct = default);
    Task<int> CreateUserWithCredentialsAsync(User user, UserCredential credential, CancellationToken ct = default);
    Task<bool> UpdateProfileAsync(int id, string nombreUsuario, string? bio, string? fotoPerfil, CancellationToken ct = default);
    Task<bool> SetActivoAsync(int id, bool activo, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default);
    Task<bool> ExistsByNombreUsuarioAsync(string nombreUsuario, CancellationToken ct = default);
}
