using AyVino.Api.Features.Users.Models;

namespace AyVino.Api.Features.Users.DTOs;

public static class UserMappingExtensions
{
    public static User ToEntity(this CreateUserRequestDto dto)
    {
        return new User
        {
            Username = dto.Username.Trim(),
            Email = dto.Email.Trim().ToLowerInvariant(),
            Role = string.IsNullOrWhiteSpace(dto.Role) ? "User" : dto.Role.Trim(),
            RegisterDate = DateTime.UtcNow,
            IsActive = true,
            Photo = dto.Photo?.Trim(),
            Bio = dto.Bio?.Trim()
        };
    }

    public static UserResponseDto ToResponseDto(this User user)
    {
        return new UserResponseDto(
            Id: user.Id,
            Username: user.Username,
            Email: user.Email,
            Role: user.Role,
            RegisterDate: user.RegisterDate,
            IsActive: user.IsActive,
            Photo: user.Photo,
            Bio: user.Bio
        );
    }

    public static IEnumerable<UserResponseDto> ToResponseDtoList(this IEnumerable<User> users)
    {
        return users.Select(u => u.ToResponseDto());
    }

    public static UserCredential ToCredentialEntity(this CreateUserRequestDto dto, int userId, string passwordHash)
    {
        return new UserCredential
        {
            UserId = userId,
            PasswordHash = passwordHash,
            LastPasswordChange = DateTime.UtcNow,
            FailedLoginAttempts = 0,
            BlockedUntil = null
        };
    }
}

