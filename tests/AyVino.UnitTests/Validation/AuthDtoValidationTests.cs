using System.ComponentModel.DataAnnotations;
using AyVino.Api.Features.Auth.DTOs;

namespace AyVino.UnitTests.Validation;

public class AuthDtoValidationTests
{
    private static LoginRequestDto ValidLogin() => new("user@example.com", "Password123!");
    private static RefreshRequestDto ValidRefresh() => new("valid_refresh_token_string");
    private static RevokeTokenRequestDto ValidRevoke() => new("valid_revoke_token_string");
    private static ChangePasswordRequestDto ValidChangePassword() => new()
    {
        CurrentPassword = "OldPassword123!",
        NewPassword = "NewPassword123!"
    };

    [Fact]
    public void LoginRequestDto_Valid_PassesValidation()
    {
        var dto = ValidLogin();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void LoginRequestDto_Email_Required(string? email)
    {
        var dto = ValidLogin() with { Email = email! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(LoginRequestDto.Email)));
    }

    [Fact]
    public void LoginRequestDto_Email_LengthBoundaries()
    {
        var validAtLimit = ValidLogin() with { Email = new string('a', 100) };
        Assert.Empty(ValidationTestHelper.Validate(validAtLimit));

        var invalidOverLimit = ValidLogin() with { Email = new string('a', 101) };
        var results = ValidationTestHelper.Validate(invalidOverLimit);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(LoginRequestDto.Email)));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void LoginRequestDto_Password_Required(string? password)
    {
        var dto = ValidLogin() with { Password = password! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(LoginRequestDto.Password)));
    }

    [Fact]
    public void LoginRequestDto_Password_LengthBoundaries()
    {
        var validAtLimit = ValidLogin() with { Password = new string('a', 128) };
        Assert.Empty(ValidationTestHelper.Validate(validAtLimit));

        var invalidOverLimit = ValidLogin() with { Password = new string('a', 129) };
        var results = ValidationTestHelper.Validate(invalidOverLimit);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(LoginRequestDto.Password)));
    }

    [Fact]
    public void LoginRequestDto_ErrorMessage_IsSpanish()
    {
        var dto = new LoginRequestDto("", "");
        var results = ValidationTestHelper.Validate(dto);
        Assert.Contains(results, r => r.ErrorMessage == "El correo electrónico es obligatorio.");
        Assert.Contains(results, r => r.ErrorMessage == "La contraseña es obligatoria.");
    }

    [Fact]
    public void RefreshRequestDto_Valid_PassesValidation()
    {
        var dto = ValidRefresh();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void RefreshRequestDto_RefreshToken_Required(string? token)
    {
        var dto = ValidRefresh() with { RefreshToken = token! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(RefreshRequestDto.RefreshToken)));
        Assert.Contains(results, r => r.ErrorMessage == "El token de refresco es obligatorio.");
    }

    [Fact]
    public void RefreshRequestDto_RefreshToken_LengthBoundaries()
    {
        var validAtLimit = ValidRefresh() with { RefreshToken = new string('a', 500) };
        Assert.Empty(ValidationTestHelper.Validate(validAtLimit));

        var invalidOverLimit = ValidRefresh() with { RefreshToken = new string('a', 501) };
        var results = ValidationTestHelper.Validate(invalidOverLimit);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(RefreshRequestDto.RefreshToken)));
    }

    [Fact]
    public void RevokeTokenRequestDto_Valid_PassesValidation()
    {
        var dto = ValidRevoke();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void RevokeTokenRequestDto_RefreshToken_Required(string? token)
    {
        var dto = ValidRevoke() with { RefreshToken = token! };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(RevokeTokenRequestDto.RefreshToken)));
    }

    [Fact]
    public void RevokeTokenRequestDto_RefreshToken_LengthBoundaries()
    {
        var validAtLimit = ValidRevoke() with { RefreshToken = new string('a', 500) };
        Assert.Empty(ValidationTestHelper.Validate(validAtLimit));

        var invalidOverLimit = ValidRevoke() with { RefreshToken = new string('a', 501) };
        var results = ValidationTestHelper.Validate(invalidOverLimit);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(RevokeTokenRequestDto.RefreshToken)));
    }

    [Fact]
    public void ChangePasswordRequestDto_Valid_PassesValidation()
    {
        var dto = ValidChangePassword();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ChangePasswordRequestDto_CurrentPassword_Required(string? currentPassword)
    {
        var dto = new ChangePasswordRequestDto
        {
            CurrentPassword = currentPassword!,
            NewPassword = "ValidPassword123"
        };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(ChangePasswordRequestDto.CurrentPassword)));
        Assert.Contains(results, r => r.ErrorMessage == "La contraseña actual es obligatoria.");
    }

    [Fact]
    public void ChangePasswordRequestDto_CurrentPassword_LengthBoundaries()
    {
        var validAtLimit = new ChangePasswordRequestDto
        {
            CurrentPassword = new string('a', 128),
            NewPassword = "ValidPassword123"
        };
        Assert.Empty(ValidationTestHelper.Validate(validAtLimit));

        var invalidOverLimit = new ChangePasswordRequestDto
        {
            CurrentPassword = new string('a', 129),
            NewPassword = "ValidPassword123"
        };
        var results = ValidationTestHelper.Validate(invalidOverLimit);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(ChangePasswordRequestDto.CurrentPassword)));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ChangePasswordRequestDto_NewPassword_Required(string? newPassword)
    {
        var dto = new ChangePasswordRequestDto
        {
            CurrentPassword = "CurrentPassword123",
            NewPassword = newPassword!
        };
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(ChangePasswordRequestDto.NewPassword)));
    }

    [Theory]
    [InlineData(7, false)]
    [InlineData(8, true)]
    [InlineData(128, true)]
    [InlineData(129, false)]
    public void ChangePasswordRequestDto_NewPassword_LengthRange(int length, bool expectedValid)
    {
        var dto = new ChangePasswordRequestDto
        {
            CurrentPassword = "CurrentPassword123",
            NewPassword = new string('a', length)
        };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(ChangePasswordRequestDto.NewPassword));
        Assert.Equal(!expectedValid, hasError);
    }
}
