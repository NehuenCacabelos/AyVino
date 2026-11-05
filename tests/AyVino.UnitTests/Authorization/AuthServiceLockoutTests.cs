using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security.Hashing;
using AyVino.Api.Common.Security.Jwt;
using AyVino.Api.Features.Auth.DTOs;
using AyVino.Api.Features.Auth.Repositories;
using AyVino.Api.Features.Auth.Services;
using AyVino.Api.Features.Users.Models;
using AyVino.Api.Features.Users.Repositories;
using Microsoft.Extensions.Options;
using NSubstitute;

namespace AyVino.UnitTests.Authorization;

public class AuthServiceLockoutTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly IJwtTokenGenerator _jwtTokenGenerator = Substitute.For<IJwtTokenGenerator>();
    private readonly IRefreshTokenRepository _refreshTokenRepository = Substitute.For<IRefreshTokenRepository>();
    private readonly IOptions<JwtSettings> _jwtSettings = Options.Create(new JwtSettings
    {
        SecretKey = "super-secret-key-that-is-at-least-32-bytes-long!",
        Issuer = "AyVino",
        Audience = "AyVinoUsers",
        ExpirationMinutes = 60,
        RefreshTokenExpirationDays = 7
    });

    private readonly AuthService _sut;

    public AuthServiceLockoutTests()
    {
        _passwordHasher.DummyHash.Returns("dummy-hash");
        _jwtTokenGenerator.GenerateToken(Arg.Any<User>())
            .Returns(("access-token", DateTime.UtcNow.AddMinutes(60)));

        _sut = new AuthService(
            _userRepository,
            _passwordHasher,
            _jwtTokenGenerator,
            _refreshTokenRepository,
            _jwtSettings);
    }

    private static User CreateUser(int id = 1, string email = "user@example.com", bool isActive = true) =>
        new()
        {
            Id = id,
            Username = "testuser",
            Email = email,
            Role = "User",
            IsActive = isActive,
            RegisterDate = DateTime.UtcNow
        };

    private static UserCredential CreateCredential(
        int userId = 1,
        string passwordHash = "hashed-password",
        int failedLoginAttempts = 0,
        DateTime? blockedUntil = null) =>
        new()
        {
            UserId = userId,
            PasswordHash = passwordHash,
            LastPasswordChange = DateTime.UtcNow,
            FailedLoginAttempts = failedLoginAttempts,
            BlockedUntil = blockedUntil
        };

    [Fact]
    public async Task LoginAsync_WrongPassword_ThrowsUnauthorizedException_AndRegistersFailedLogin()
    {
        // Arrange
        var user = CreateUser();
        var credential = CreateCredential(failedLoginAttempts: 0);
        _userRepository.GetUserWithCredentialsByEmailAsync(user.Email, Arg.Any<CancellationToken>())
            .Returns((user, credential));

        _passwordHasher.VerifyPassword("wrong-password", credential.PasswordHash).Returns(false);

        var request = new LoginRequestDto(user.Email, "wrong-password");
        var before = DateTime.UtcNow;

        // Act
        var ex = await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _sut.LoginAsync(request, "127.0.0.1"));

        var after = DateTime.UtcNow;

        // Assert
        Assert.Equal("Credenciales inválidas.", ex.Message);

        await _userRepository.Received(1).RegisterFailedLoginAsync(
            user.Id,
            5,
            Arg.Is<DateTime>(dt => dt >= before && dt <= after),
            Arg.Is<DateTime>(dt => dt >= before.AddMinutes(15) && dt <= after.AddMinutes(15)),
            Arg.Any<CancellationToken>());

        await _userRepository.DidNotReceive().ResetFailedLoginAttemptsAsync(
            Arg.Any<int>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task LoginAsync_CorrectPassword_WithPreviousFailedAttempts_ResetsFailedLoginAttempts_AndSucceeds()
    {
        // Arrange
        var user = CreateUser();
        var credential = CreateCredential(failedLoginAttempts: 3, blockedUntil: null);
        _userRepository.GetUserWithCredentialsByEmailAsync(user.Email, Arg.Any<CancellationToken>())
            .Returns((user, credential));

        _passwordHasher.VerifyPassword("correct-password", credential.PasswordHash).Returns(true);

        var request = new LoginRequestDto(user.Email, "correct-password");

        // Act
        var response = await _sut.LoginAsync(request, "127.0.0.1");

        // Assert
        Assert.NotNull(response);
        Assert.Equal("access-token", response.AccessToken);

        await _userRepository.Received(1).ResetFailedLoginAttemptsAsync(
            user.Id,
            Arg.Any<CancellationToken>());

        await _userRepository.DidNotReceive().RegisterFailedLoginAsync(
            Arg.Any<int>(),
            Arg.Any<int>(),
            Arg.Any<DateTime>(),
            Arg.Any<DateTime>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task LoginAsync_CorrectPassword_WithoutFailedAttemptsOrLockout_DoesNotCallReset()
    {
        // Arrange
        var user = CreateUser();
        var credential = CreateCredential(failedLoginAttempts: 0, blockedUntil: null);
        _userRepository.GetUserWithCredentialsByEmailAsync(user.Email, Arg.Any<CancellationToken>())
            .Returns((user, credential));

        _passwordHasher.VerifyPassword("correct-password", credential.PasswordHash).Returns(true);

        var request = new LoginRequestDto(user.Email, "correct-password");

        // Act
        var response = await _sut.LoginAsync(request, "127.0.0.1");

        // Assert
        Assert.NotNull(response);
        await _userRepository.DidNotReceive().ResetFailedLoginAttemptsAsync(
            Arg.Any<int>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task LoginAsync_AccountLocked_ThrowsUnauthorizedException_DoesNotVerifyPassword_AndDoesNotRegisterFailedLogin()
    {
        // Arrange
        var user = CreateUser();
        var blockedUntil = DateTime.UtcNow.AddMinutes(10);
        var credential = CreateCredential(failedLoginAttempts: 5, blockedUntil: blockedUntil);
        _userRepository.GetUserWithCredentialsByEmailAsync(user.Email, Arg.Any<CancellationToken>())
            .Returns((user, credential));

        var request = new LoginRequestDto(user.Email, "any-password");

        // Act
        var ex = await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _sut.LoginAsync(request, "127.0.0.1"));

        // Assert
        Assert.Contains("La cuenta se encuentra temporalmente bloqueada", ex.Message);
        Assert.Contains(blockedUntil.ToString("yyyy-MM-dd HH:mm:ss"), ex.Message);

        _passwordHasher.DidNotReceive().VerifyPassword(
            Arg.Any<string>(),
            Arg.Any<string>());

        await _userRepository.DidNotReceive().RegisterFailedLoginAsync(
            Arg.Any<int>(),
            Arg.Any<int>(),
            Arg.Any<DateTime>(),
            Arg.Any<DateTime>(),
            Arg.Any<CancellationToken>());

        await _userRepository.DidNotReceive().ResetFailedLoginAttemptsAsync(
            Arg.Any<int>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task LoginAsync_ExpiredLockout_WithCorrectPassword_Succeeds_AndResetsFailedAttempts()
    {
        // Arrange
        var user = CreateUser();
        var expiredBlock = DateTime.UtcNow.AddMinutes(-1);
        var credential = CreateCredential(failedLoginAttempts: 5, blockedUntil: expiredBlock);
        _userRepository.GetUserWithCredentialsByEmailAsync(user.Email, Arg.Any<CancellationToken>())
            .Returns((user, credential));

        _passwordHasher.VerifyPassword("correct-password", credential.PasswordHash).Returns(true);

        var request = new LoginRequestDto(user.Email, "correct-password");

        // Act
        var response = await _sut.LoginAsync(request, "127.0.0.1");

        // Assert
        Assert.NotNull(response);
        await _userRepository.Received(1).ResetFailedLoginAttemptsAsync(
            user.Id,
            Arg.Any<CancellationToken>());

        await _userRepository.DidNotReceive().RegisterFailedLoginAsync(
            Arg.Any<int>(),
            Arg.Any<int>(),
            Arg.Any<DateTime>(),
            Arg.Any<DateTime>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task LoginAsync_NonExistentEmail_ThrowsUnauthorizedException_AndCallsNoCounterMethods()
    {
        // Arrange
        _userRepository.GetUserWithCredentialsByEmailAsync("nonexistent@example.com", Arg.Any<CancellationToken>())
            .Returns(((User?)null, (UserCredential?)null));

        var request = new LoginRequestDto("nonexistent@example.com", "any-password");

        // Act
        var ex = await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _sut.LoginAsync(request, "127.0.0.1"));

        // Assert
        Assert.Equal("Credenciales inválidas.", ex.Message);

        _passwordHasher.Received(1).VerifyPassword("any-password", "dummy-hash");

        await _userRepository.DidNotReceive().RegisterFailedLoginAsync(
            Arg.Any<int>(),
            Arg.Any<int>(),
            Arg.Any<DateTime>(),
            Arg.Any<DateTime>(),
            Arg.Any<CancellationToken>());

        await _userRepository.DidNotReceive().ResetFailedLoginAttemptsAsync(
            Arg.Any<int>(),
            Arg.Any<CancellationToken>());
    }
}
