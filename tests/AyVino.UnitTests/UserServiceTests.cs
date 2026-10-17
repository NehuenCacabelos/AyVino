using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security.Hashing;
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
}
