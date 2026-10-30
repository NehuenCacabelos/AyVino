using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security.Hashing;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Models;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Users.Services;

namespace AyVino.UnitTests;

public class UserSecurityTests
{
    [Fact]
    public void RegisterUserRequestDto_ToCreateDto_AlwaysAssignsUserRole()
    {
        // Arrange
        var publicRegisterDto = new RegisterUserRequestDto(
            Username: "somewineenthusiast",
            Email: "user@ayvino.com",
            Password: "SecurePassword123!",
            Bio: "Wine lover"
        );

        // Act
        var createDto = publicRegisterDto.ToCreateDto();

        // Assert - Rol forzado e inmutable desde el endpoint público
        Assert.Equal(AppRoles.User, createDto.Role);
        Assert.Equal("somewineenthusiast", createDto.Username);
        Assert.Equal("user@ayvino.com", createDto.Email);
    }

    [Fact]
    public void PasswordHasher_HashAndVerify_WorksCorrectly()
    {
        // Arrange
        var hasher = new PasswordHasher();
        const string password = "SuperSecretPassword123!";

        // Act
        var hash = hasher.HashPassword(password);

        // Assert
        Assert.NotEmpty(hash);
        Assert.Contains(":", hash);
        Assert.True(hasher.VerifyPassword(password, hash));
        Assert.False(hasher.VerifyPassword("WrongPassword123!", hash));
    }

    [Fact]
    public async Task UserService_RegisterAsync_ThrowsValidationException_WhenPasswordShorterThan8Chars()
    {
        // Arrange
        var fakeRepo = new FakeUserRepository();
        var hasher = new PasswordHasher();
        var userService = new UserService(fakeRepo, hasher);

        var requestWithShortPassword = new CreateUserRequestDto(
            Username: "validenthusiast",
            Email: "test@ayvino.com",
            Password: "short" // 5 chars (< 8)
        );

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            userService.RegisterAsync(requestWithShortPassword));

        Assert.Contains("8 caracteres", exception.Message);
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(-1, 10)]
    [InlineData(1, 0)]
    [InlineData(1, 101)]
    public async Task UserService_GetAllAsync_InvalidPagination_ThrowsValidationException(int pageNumber, int pageSize)
    {
        // Arrange
        var fakeRepo = new FakeUserRepository();
        var hasher = new PasswordHasher();
        var userService = new UserService(fakeRepo, hasher);

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => userService.GetAllAsync(pageNumber, pageSize));
    }

    private sealed class FakeUserRepository : IUserRepository
    {
        public Task<User?> GetByIdAsync(int id, CancellationToken ct = default) => Task.FromResult<User?>(null);
        public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) => Task.FromResult<User?>(null);
        public Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default) => Task.FromResult<User?>(null);
        public Task<PublicUserProfileDto?> GetPublicProfileByUsernameAsync(string username, CancellationToken ct = default) => Task.FromResult<PublicUserProfileDto?>(null);
        public Task<IEnumerable<User>> GetAllAsync(int pageNumber, int pageSize, CancellationToken ct = default) => Task.FromResult<IEnumerable<User>>([]);
        public Task<(User? User, UserCredential? Credential)> GetUserWithCredentialsByEmailAsync(string email, CancellationToken ct = default) => Task.FromResult<(User?, UserCredential?)>((null, null));
        public Task<int> CreateUserWithCredentialsAsync(User user, UserCredential credential, CancellationToken ct = default) => Task.FromResult(1);
        public Task<bool> UpdateProfileAsync(int id, string username, string? bio, CancellationToken ct = default) => Task.FromResult(true);
        public Task<bool> SetIsActiveAsync(int id, bool isActive, CancellationToken ct = default) => Task.FromResult(true);
        public Task<bool> DeleteAsync(int id, CancellationToken ct = default) => Task.FromResult(true);
        public Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default) => Task.FromResult(false);
        public Task<bool> ExistsByUsernameAsync(string username, CancellationToken ct = default) => Task.FromResult(false);
        public Task<UserCredential?> GetUserCredentialsByIdAsync(int userId, CancellationToken ct = default) => Task.FromResult<UserCredential?>(null);
        public Task<bool> UpdatePasswordAsync(int userId, string passwordHash, DateTime lastPasswordChange, CancellationToken ct = default) => Task.FromResult(true);
        public Task RegisterFailedLoginAsync(int userId, int maxAttempts, DateTime nowUtc, DateTime blockedUntilUtc, CancellationToken ct = default) => throw new NotImplementedException();
        public Task ResetFailedLoginAttemptsAsync(int userId, CancellationToken ct = default) => throw new NotImplementedException();
    }

    [Fact]
    public async Task UserService_RegisterAsync_WineryRole_WhenUsernameExists_DisambiguatesWithoutConflict()
    {
        // Arrange
        var fakeRepo = new DisambiguatingUserRepository(existingUsername: "Juan Perez");
        var hasher = new PasswordHasher();
        var userService = new UserService(fakeRepo, hasher);

        var request = new CreateUserRequestDto(
            Username: "Juan Perez",
            Email: "juan@bodega.com",
            Password: "Password123!",
            Role: AppRoles.Winery
        );

        // Act
        var result = await userService.RegisterAsync(request);

        // Assert: se desambigua agregando sufijo numérico
        Assert.Equal("Juan Perez 2", result.Username);
        Assert.Equal("juan@bodega.com", result.Email);
    }

    [Fact]
    public async Task UserService_RegisterAsync_UserRole_WhenUsernameExists_ThrowsConflictException()
    {
        // Arrange
        var fakeRepo = new DisambiguatingUserRepository(existingUsername: "Juan Perez");
        var hasher = new PasswordHasher();
        var userService = new UserService(fakeRepo, hasher);

        var request = new CreateUserRequestDto(
            Username: "Juan Perez",
            Email: "otro@correo.com",
            Password: "Password123!",
            Role: AppRoles.User
        );

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(() => userService.RegisterAsync(request));
    }

    private sealed class DisambiguatingUserRepository : IUserRepository
    {
        private readonly HashSet<string> _existing = new(StringComparer.OrdinalIgnoreCase);

        public DisambiguatingUserRepository(string existingUsername)
        {
            _existing.Add(existingUsername);
        }

        public Task<bool> ExistsByUsernameAsync(string username, CancellationToken ct = default)
            => Task.FromResult(_existing.Contains(username));

        public Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default)
            => Task.FromResult(false);

        public Task<int> CreateUserWithCredentialsAsync(User user, UserCredential credential, CancellationToken ct = default)
            => Task.FromResult(42);

        public Task<User?> GetByIdAsync(int id, CancellationToken ct = default) => Task.FromResult<User?>(null);
        public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) => Task.FromResult<User?>(null);
        public Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default) => Task.FromResult<User?>(null);
        public Task<PublicUserProfileDto?> GetPublicProfileByUsernameAsync(string username, CancellationToken ct = default) => Task.FromResult<PublicUserProfileDto?>(null);
        public Task<IEnumerable<User>> GetAllAsync(int pageNumber, int pageSize, CancellationToken ct = default) => Task.FromResult<IEnumerable<User>>([]);
        public Task<(User? User, UserCredential? Credential)> GetUserWithCredentialsByEmailAsync(string email, CancellationToken ct = default) => Task.FromResult<(User?, UserCredential?)>((null, null));
        public Task<bool> UpdateProfileAsync(int id, string username, string? bio, CancellationToken ct = default) => Task.FromResult(true);
        public Task<bool> SetIsActiveAsync(int id, bool isActive, CancellationToken ct = default) => Task.FromResult(true);
        public Task<bool> DeleteAsync(int id, CancellationToken ct = default) => Task.FromResult(true);
        public Task<UserCredential?> GetUserCredentialsByIdAsync(int userId, CancellationToken ct = default) => Task.FromResult<UserCredential?>(null);
        public Task<bool> UpdatePasswordAsync(int userId, string passwordHash, DateTime lastPasswordChange, CancellationToken ct = default) => Task.FromResult(true);
        public Task RegisterFailedLoginAsync(int userId, int maxAttempts, DateTime nowUtc, DateTime blockedUntilUtc, CancellationToken ct = default) => throw new NotImplementedException();
        public Task ResetFailedLoginAttemptsAsync(int userId, CancellationToken ct = default) => throw new NotImplementedException();
    }
}
