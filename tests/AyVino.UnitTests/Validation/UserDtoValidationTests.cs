using System.ComponentModel.DataAnnotations;
using AyVino.Api.Features.Users.DTOs;

namespace AyVino.UnitTests.Validation;

public class UserDtoValidationTests
{
    private static CreateUserRequestDto ValidCreateUser() => new(
        Username: "sommelier_juan",
        Email: "juan@example.com",
        Password: "Password123!",
        Role: "User",
        Bio: "Amante del buen vino.",
        Photo: "avatar.jpg"
    );

    private static RegisterUserRequestDto ValidRegisterUser() => new(
        Username: "sommelier_juan",
        Email: "juan@example.com",
        Password: "Password123!",
        Bio: "Amante del buen vino.",
        Photo: "avatar.jpg"
    );

    private static UpdateUserProfileRequestDto ValidUpdateProfile() => new(
        Username: "sommelier_juan",
        Bio: "Nueva biografía.",
        Photo: "nueva_foto.jpg"
    );

    [Fact]
    public void CreateUserRequestDto_Valid_PassesValidation()
    {
        var dto = ValidCreateUser();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateUserRequestDto_Username_Required(string? username)
    {
        var dto = ValidCreateUser() with { Username = username! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateUserRequestDto.Username)));
    }

    [Fact]
    public void CreateUserRequestDto_Username_LengthBoundaries()
    {
        var valid = ValidCreateUser() with { Username = new string('a', 100) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreateUser() with { Username = new string('a', 101) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateUserRequestDto.Username)));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateUserRequestDto_Email_Required(string? email)
    {
        var dto = ValidCreateUser() with { Email = email! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateUserRequestDto.Email)));
    }

    [Theory]
    [InlineData("sin-arroba")]
    [InlineData("invalido@")]
    public void CreateUserRequestDto_Email_InvalidFormat(string email)
    {
        var dto = ValidCreateUser() with { Email = email };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateUserRequestDto.Email)));
    }

    [Fact]
    public void CreateUserRequestDto_Email_LengthBoundaries()
    {
        // 100 chars email valid: 88 chars + "@example.com" = 100 chars
        var validEmail = new string('a', 88) + "@example.com";
        var valid = ValidCreateUser() with { Email = validEmail };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalidEmail = new string('a', 89) + "@example.com";
        var invalid = ValidCreateUser() with { Email = invalidEmail };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateUserRequestDto.Email)));
    }

    [Theory]
    [InlineData(7, false)]
    [InlineData(8, true)]
    [InlineData(128, true)]
    [InlineData(129, false)]
    public void CreateUserRequestDto_Password_LengthRange(int length, bool expectedValid)
    {
        var dto = ValidCreateUser() with { Password = new string('a', length) };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(CreateUserRequestDto.Password));
        Assert.Equal(!expectedValid, hasError);
    }

    [Fact]
    public void CreateUserRequestDto_Role_LengthBoundaries()
    {
        var valid = ValidCreateUser() with { Role = new string('a', 100) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreateUser() with { Role = new string('a', 101) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateUserRequestDto.Role)));
    }

    [Fact]
    public void CreateUserRequestDto_Bio_LengthBoundaries()
    {
        var valid = ValidCreateUser() with { Bio = new string('a', 1000) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreateUser() with { Bio = new string('a', 1001) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateUserRequestDto.Bio)));
    }

    [Fact]
    public void CreateUserRequestDto_Photo_LengthBoundaries()
    {
        var valid = ValidCreateUser() with { Photo = new string('a', 100) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreateUser() with { Photo = new string('a', 101) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateUserRequestDto.Photo)));
    }

    [Fact]
    public void CreateUserRequestDto_ErrorMessage_IsSpanish()
    {
        var dto = new CreateUserRequestDto("", "sin-arroba", "123");
        var results = ValidationTestHelper.Validate(dto);
        Assert.Contains(results, r => r.ErrorMessage == "El nombre de usuario es obligatorio.");
        Assert.Contains(results, r => r.ErrorMessage == "El formato del correo electrónico no es válido.");
        Assert.Contains(results, r => r.ErrorMessage == "La contraseña debe tener entre 8 y 128 caracteres.");
    }

    [Fact]
    public void RegisterUserRequestDto_Valid_PassesValidation()
    {
        var dto = ValidRegisterUser();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void RegisterUserRequestDto_Username_Required(string? username)
    {
        var dto = ValidRegisterUser() with { Username = username! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(RegisterUserRequestDto.Username)));
    }

    [Fact]
    public void UpdateUserProfileRequestDto_Valid_PassesValidation()
    {
        var dto = ValidUpdateProfile();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void UpdateUserProfileRequestDto_Username_Required(string? username)
    {
        var dto = ValidUpdateProfile() with { Username = username! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(UpdateUserProfileRequestDto.Username)));
    }

    [Fact]
    public void UpdateUserProfileRequestDto_BioAndPhoto_Null_Valid()
    {
        var dto = new UpdateUserProfileRequestDto("valid_user", null, null);
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }
}
