using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security.Hashing;
using AyVino.Api.Features.Users.Models;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Users.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class UserRoleChangeTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly UserService _service;

    public UserRoleChangeTests()
    {
        _service = new UserService(_userRepository, _passwordHasher);
    }

    private static User CreateUser(int id, string role = AppRoles.User) =>
        new()
        {
            Id = id,
            Username = $"user_{id}",
            Email = $"user_{id}@example.com",
            Role = role,
            IsActive = true,
            RegisterDate = DateTime.UtcNow
        };

    [Fact]
    public async Task ChangeRoleAsync_UserToAdmin_Succeeds_CallsRepositoryWithCanonicalRole()
    {
        // Arrange
        var targetUser = CreateUser(id: 2, role: AppRoles.User);
        _userRepository.GetByIdAsync(2, Arg.Any<CancellationToken>()).Returns(targetUser);
        _userRepository.SetRoleAsync(2, AppRoles.Admin, Arg.Any<CancellationToken>()).Returns(true);

        // Act
        await _service.ChangeRoleAsync(actorId: 1, targetId: 2, role: "admin");

        // Assert
        await _userRepository.Received(1).SetRoleAsync(2, AppRoles.Admin, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ChangeRoleAsync_AdminToUser_Succeeds_CallsRepositoryWithCanonicalRole()
    {
        // Arrange
        var targetUser = CreateUser(id: 2, role: AppRoles.Admin);
        _userRepository.GetByIdAsync(2, Arg.Any<CancellationToken>()).Returns(targetUser);
        _userRepository.SetRoleAsync(2, AppRoles.User, Arg.Any<CancellationToken>()).Returns(true);

        // Act
        await _service.ChangeRoleAsync(actorId: 1, targetId: 2, role: "user");

        // Assert
        await _userRepository.Received(1).SetRoleAsync(2, AppRoles.User, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ChangeRoleAsync_TargetIdEqualsActorId_ThrowsForbiddenException()
    {
        // Arrange
        var targetUser = CreateUser(id: 1, role: AppRoles.Admin);
        _userRepository.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(targetUser);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.ChangeRoleAsync(actorId: 1, targetId: 1, role: AppRoles.User));

        Assert.Equal("No se puede modificar el rol de la propia cuenta.", ex.Message);
        await _userRepository.DidNotReceiveWithAnyArgs().SetRoleAsync(default, default!, default);
    }

    [Fact]
    public async Task ChangeRoleAsync_TargetHasWineryRole_ThrowsConflictException()
    {
        // Arrange
        var targetUser = CreateUser(id: 2, role: AppRoles.Winery);
        _userRepository.GetByIdAsync(2, Arg.Any<CancellationToken>()).Returns(targetUser);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            _service.ChangeRoleAsync(actorId: 1, targetId: 2, role: AppRoles.Admin));

        Assert.Equal("El rol Winery se asigna al registrar una bodega y no puede modificarse manualmente.", ex.Message);
        await _userRepository.DidNotReceiveWithAnyArgs().SetRoleAsync(default, default!, default);
    }

    [Theory]
    [InlineData("Winery")]
    [InlineData("SuperAdmin")]
    [InlineData("")]
    [InlineData("   ")]
    public async Task ChangeRoleAsync_InvalidRole_ThrowsValidationException(string invalidRole)
    {
        // Arrange
        var targetUser = CreateUser(id: 2, role: AppRoles.User);
        _userRepository.GetByIdAsync(2, Arg.Any<CancellationToken>()).Returns(targetUser);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.ChangeRoleAsync(actorId: 1, targetId: 2, role: invalidRole));

        Assert.Equal($"Rol inválido: '{invalidRole}'. Valores permitidos: Admin, User.", ex.Message);
        await _userRepository.DidNotReceiveWithAnyArgs().SetRoleAsync(default, default!, default);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    [InlineData(999)]
    public async Task ChangeRoleAsync_NonExistentUser_ThrowsNotFoundException(int targetId)
    {
        // Arrange
        _userRepository.GetByIdAsync(targetId, Arg.Any<CancellationToken>()).Returns((User?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.ChangeRoleAsync(actorId: 1, targetId: targetId, role: AppRoles.Admin));

        Assert.Equal($"Usuario con ID {targetId} no encontrado.", ex.Message);
        await _userRepository.DidNotReceiveWithAnyArgs().SetRoleAsync(default, default!, default);
    }

    [Fact]
    public async Task ChangeRoleAsync_RoleMatchesCurrentRole_DoesNotCallRepository()
    {
        // Arrange
        var targetUser = CreateUser(id: 2, role: AppRoles.Admin);
        _userRepository.GetByIdAsync(2, Arg.Any<CancellationToken>()).Returns(targetUser);

        // Act
        await _service.ChangeRoleAsync(actorId: 1, targetId: 2, role: "admin");

        // Assert
        await _userRepository.DidNotReceiveWithAnyArgs().SetRoleAsync(default, default!, default);
    }
}
