using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security.Hashing;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Models;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Users.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class UserServiceTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly UserService _userService;

    public UserServiceTests()
    {
        _userService = new UserService(_userRepository, _passwordHasher);
    }

    [Fact]
    public async Task GetAllAsync_ValidPagination_ReturnsMappedUserResponseDtos()
    {
        // Arrange
        var users = new List<User>
        {
            new()
            {
                Id = 1,
                Username = "juanperez",
                Email = "juan@example.com",
                Role = "User",
                RegisterDate = DateTime.UtcNow,
                IsActive = true
            },
            new()
            {
                Id = 2,
                Username = "marialopez",
                Email = "maria@example.com",
                Role = "Winery",
                RegisterDate = DateTime.UtcNow,
                IsActive = true
            }
        };

        _userRepository.GetAllAsync(1, 10, Arg.Any<CancellationToken>())
            .Returns(users);

        // Act
        var result = (await _userService.GetAllAsync(1, 10)).ToList();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal("juanperez", result[0].Username);
        Assert.Equal("marialopez", result[1].Username);
        await _userRepository.Received(1).GetAllAsync(1, 10, Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(-1, 10)]
    public async Task GetAllAsync_InvalidPageNumber_ThrowsValidationException(int pageNumber, int pageSize)
    {
        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _userService.GetAllAsync(pageNumber, pageSize));
        Assert.Contains("pageNumber", ex.Message, StringComparison.OrdinalIgnoreCase);
        await _userRepository.DidNotReceive().GetAllAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(1, 0)]
    [InlineData(1, -5)]
    [InlineData(1, 101)]
    public async Task GetAllAsync_InvalidPageSize_ThrowsValidationException(int pageNumber, int pageSize)
    {
        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _userService.GetAllAsync(pageNumber, pageSize));
        Assert.Contains("pageSize", ex.Message, StringComparison.OrdinalIgnoreCase);
        await _userRepository.DidNotReceive().GetAllAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAvatarAsync_ValidIdAndPhoto_UpdatesAndReturnsDto()
    {
        // Arrange
        var user = new User
        {
            Id = 5,
            Username = "lucasvino",
            Email = "lucas@example.com",
            Role = "User",
            Bio = "Sommelier en formación",
            Photo = null
        };

        _userRepository.GetByIdAsync(5, Arg.Any<CancellationToken>())
            .Returns(user);
        _userRepository.UpdateProfileAsync(5, "lucasvino", "Sommelier en formación", "/uploads/avatars/5_photo.webp", Arg.Any<CancellationToken>())
            .Returns(true);

        // Act
        var result = await _userService.UpdateAvatarAsync(5, " /uploads/avatars/5_photo.webp ");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Id);
        Assert.Equal("/uploads/avatars/5_photo.webp", result.Photo);
        await _userRepository.Received(1).UpdateProfileAsync(5, "lucasvino", "Sommelier en formación", "/uploads/avatars/5_photo.webp", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAvatarAsync_EmptyOrWhitespacePhoto_SetsPhotoToNull()
    {
        // Arrange
        var user = new User
        {
            Id = 5,
            Username = "lucasvino",
            Email = "lucas@example.com",
            Photo = "/uploads/avatars/old.webp"
        };

        _userRepository.GetByIdAsync(5, Arg.Any<CancellationToken>())
            .Returns(user);
        _userRepository.UpdateProfileAsync(5, "lucasvino", null, null, Arg.Any<CancellationToken>())
            .Returns(true);

        // Act
        var result = await _userService.UpdateAvatarAsync(5, "   ");

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.Photo);
        await _userRepository.Received(1).UpdateProfileAsync(5, "lucasvino", null, null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAvatarAsync_UserNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _userRepository.GetByIdAsync(999, Arg.Any<CancellationToken>())
            .Returns((User?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _userService.UpdateAvatarAsync(999, "/uploads/photo.jpg"));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task UpdateAvatarAsync_InvalidId_ThrowsNotFoundException(int id)
    {
        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _userService.UpdateAvatarAsync(id, "/uploads/photo.jpg"));
        await _userRepository.DidNotReceive().GetByIdAsync(Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetPublicProfileByUsernameAsync_ExistingUser_ReturnsPublicUserProfileDto()
    {
        // Arrange
        var profile = new PublicUserProfileDto(1, "sommelier_pro", "/uploads/avatar.webp", "Amante del buen vino", DateTime.UtcNow, 15, 42, 10);
        _userRepository.GetPublicProfileByUsernameAsync("sommelier_pro", Arg.Any<CancellationToken>())
            .Returns(profile);

        // Act
        var result = await _userService.GetPublicProfileByUsernameAsync("sommelier_pro");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("sommelier_pro", result.Username);
        Assert.Equal(15, result.CellarWinesCount);
        Assert.Equal(42, result.FollowersCount);
        await _userRepository.Received(1).GetPublicProfileByUsernameAsync("sommelier_pro", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetPublicProfileByUsernameAsync_UserNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _userRepository.GetPublicProfileByUsernameAsync("inexistente", Arg.Any<CancellationToken>())
            .Returns((PublicUserProfileDto?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _userService.GetPublicProfileByUsernameAsync("inexistente"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task GetPublicProfileByUsernameAsync_InvalidUsername_ThrowsNotFoundException(string? invalidUsername)
    {
        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _userService.GetPublicProfileByUsernameAsync(invalidUsername!));
    }
}
