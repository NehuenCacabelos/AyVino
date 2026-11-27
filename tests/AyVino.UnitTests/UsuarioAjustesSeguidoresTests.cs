using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Users.Services;
using NSubstitute;
using Xunit;

namespace AyVino.UnitTests;

public class UsuarioAjustesSeguidoresTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly UserService _userService;

    public UsuarioAjustesSeguidoresTests()
    {
        _userService = new UserService(_userRepository, Substitute.For<AyVino.Api.Common.Security.Hashing.IPasswordHasher>());
    }

    [Fact]
    public async Task GetPublicProfileByUsernameAsync_ReturnsProfileWithCombinedFollowingCount()
    {
        // Arrange
        const string username = "Kevin";
        var expectedProfile = new PublicUserProfileDto(
            Id: 42,
            Username: username,
            AvatarImageId: null,
            Bio: "Sommelier y coleccionista de vinos",
            RegisterDate: DateTime.UtcNow.AddMonths(-6),
            CellarWinesCount: 4,
            FollowersCount: 12,
            FollowingCount: 7 // 4 usuarios + 3 bodegas
        );

        _userRepository.GetPublicProfileByUsernameAsync(username, Arg.Any<CancellationToken>())
            .Returns(expectedProfile);

        // Act
        var result = await _userService.GetPublicProfileByUsernameAsync(username);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(username, result.Username);
        Assert.Equal(4, result.CellarWinesCount);
        Assert.Equal(12, result.FollowersCount);
        Assert.Equal(7, result.FollowingCount);
        await _userRepository.Received(1).GetPublicProfileByUsernameAsync(username, Arg.Any<CancellationToken>());
    }
}
