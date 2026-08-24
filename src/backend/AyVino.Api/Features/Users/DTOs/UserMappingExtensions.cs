using AyVino.Api.Features.Users.Models;

namespace AyVino.Api.Features.Users.DTOs;

public static class UserMappingExtensions
{
    public static User ToEntity(this CreateUserRequestDto dto)
    {
        return new User
        {
            NombreUsuario = dto.NombreUsuario.Trim(),
            Email = dto.Email.Trim().ToLowerInvariant(),
            Rol = string.IsNullOrWhiteSpace(dto.Rol) ? "Usuario" : dto.Rol.Trim(),
            FechaRegistro = DateTime.UtcNow,
            Activo = true,
            FotoPerfil = dto.FotoPerfil?.Trim(),
            Bio = dto.Bio?.Trim()
        };
    }

    public static UserResponseDto ToResponseDto(this User user)
    {
        return new UserResponseDto(
            Id: user.Id,
            NombreUsuario: user.NombreUsuario,
            Email: user.Email,
            Rol: user.Rol,
            FechaRegistro: user.FechaRegistro,
            Activo: user.Activo,
            FotoPerfil: user.FotoPerfil,
            Bio: user.Bio
        );
    }

    public static IEnumerable<UserResponseDto> ToResponseDtoList(this IEnumerable<User> users)
    {
        return users.Select(u => u.ToResponseDto());
    }

    public static UserCredential ToCredentialEntity(this CreateUserRequestDto dto, int usuarioId, string passwordHash)
    {
        return new UserCredential
        {
            UsuarioId = usuarioId,
            PasswordHash = passwordHash,
            UltimoCambioPassword = DateTime.UtcNow,
            IntentosFallidos = 0,
            BloqueadoHasta = null
        };
    }
}

