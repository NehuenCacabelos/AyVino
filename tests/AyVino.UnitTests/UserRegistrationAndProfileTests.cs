using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security.Hashing;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Enums;
using AyVino.Api.Features.Users.Models;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Users.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class UserRegistrationAndProfileTests
{
    private readonly IUserRepository _userRepo = Substitute.For<IUserRepository>();
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly UserService _service;

    public UserRegistrationAndProfileTests()
    {
        _passwordHasher.HashPassword(Arg.Any<string>()).Returns("hashed_secret");
        _service = new UserService(_userRepo, _passwordHasher);
    }

    [Fact]
    public async Task IsUsernameAvailableAsync_WhenTaken_ReturnsFalse()
    {
        _userRepo.ExistsByUsernameAsync("sommelier_juan", Arg.Any<CancellationToken>()).Returns(true);

        var result = await _service.IsUsernameAvailableAsync("sommelier_juan");

        Assert.False(result);
    }

    [Fact]
    public async Task IsUsernameAvailableAsync_WhenNotTaken_ReturnsTrue()
    {
        _userRepo.ExistsByUsernameAsync("nuevo_usuario", Arg.Any<CancellationToken>()).Returns(false);

        var result = await _service.IsUsernameAvailableAsync("nuevo_usuario");

        Assert.True(result);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task IsUsernameAvailableAsync_WhenEmptyOrWhitespace_ReturnsFalse(string? username)
    {
        var result = await _service.IsUsernameAvailableAsync(username);

        Assert.False(result);
        await _userRepo.DidNotReceiveWithAnyArgs().ExistsByUsernameAsync(default!, default);
    }

    [Fact]
    public async Task RegisterAsync_WithBirthDateAndGender_Succeeds()
    {
        _userRepo.ExistsByEmailAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(false);
        _userRepo.ExistsByUsernameAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(false);
        _userRepo.CreateUserWithCredentialsAsync(Arg.Any<User>(), Arg.Any<UserCredential>(), Arg.Any<CancellationToken>())
            .Returns(10);

        var birthDate = new DateOnly(1995, 6, 15);
        var dto = new CreateUserRequestDto(
            Username: "juanperez",
            Email: "juan@test.com",
            Password: "Password123!",
            Role: "User",
            BirthDate: birthDate,
            Gender: Gender.Male
        );

        var result = await _service.RegisterAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("juanperez", result.Username);
        Assert.Equal(birthDate, result.BirthDate);
        Assert.Equal("Male", result.Gender);

        await _userRepo.Received(1).CreateUserWithCredentialsAsync(
            Arg.Is<User>(u => u.BirthDate == birthDate && u.Gender == Gender.Male),
            Arg.Any<UserCredential>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task RegisterAsync_FutureBirthDate_ThrowsValidationException()
    {
        var futureDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2));
        var dto = new CreateUserRequestDto(
            Username: "juanperez",
            Email: "juan@test.com",
            Password: "Password123!",
            Role: "User",
            BirthDate: futureDate
        );

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.RegisterAsync(dto));
        Assert.Contains("futura", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task RegisterAsync_BirthDateBefore1900_ThrowsValidationException()
    {
        var ancientDate = new DateOnly(1899, 12, 31);
        var dto = new CreateUserRequestDto(
            Username: "juanperez",
            Email: "juan@test.com",
            Password: "Password123!",
            Role: "User",
            BirthDate: ancientDate
        );

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.RegisterAsync(dto));
        Assert.Contains("1900", ex.Message);
    }

    [Fact]
    public async Task RegisterAsync_InvalidGender_ThrowsValidationException()
    {
        var dto = new CreateUserRequestDto(
            Username: "juanperez",
            Email: "juan@test.com",
            Password: "Password123!",
            Role: "User",
            Gender: (Gender)99
        );

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.RegisterAsync(dto));
        Assert.Contains("género", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UpdateProfileAsync_WithBirthDateAndGender_Succeeds()
    {
        var existingUser = new User
        {
            Id = 5,
            Username = "juan",
            Email = "juan@test.com",
            BirthDate = null,
            Gender = null
        };
        _userRepo.GetByIdAsync(5, Arg.Any<CancellationToken>()).Returns(existingUser);
        _userRepo.UpdateProfileAsync(5, "juan_actualizado", "Nueva bio", Arg.Any<DateOnly?>(), Arg.Any<Gender?>(), Arg.Any<CancellationToken>())
            .Returns(true);

        var newBirthDate = new DateOnly(1990, 3, 20);
        var updateDto = new UpdateUserProfileRequestDto(
            Username: "juan_actualizado",
            Bio: "Nueva bio",
            BirthDate: newBirthDate,
            Gender: Gender.Other
        );

        var result = await _service.UpdateProfileAsync(5, updateDto);

        Assert.NotNull(result);
        Assert.Equal("juan_actualizado", result.Username);
        Assert.Equal(newBirthDate, result.BirthDate);
        Assert.Equal("Other", result.Gender);

        await _userRepo.Received(1).UpdateProfileAsync(
            5,
            "juan_actualizado",
            "Nueva bio",
            newBirthDate,
            Gender.Other,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public void PublicUserProfileDto_DoesNotIncludeBirthDateOrGender()
    {
        var properties = typeof(PublicUserProfileDto).GetProperties();
        var propertyNames = properties.Select(p => p.Name).ToList();

        Assert.DoesNotContain("BirthDate", propertyNames, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain("Gender", propertyNames, StringComparer.OrdinalIgnoreCase);
    }
}
