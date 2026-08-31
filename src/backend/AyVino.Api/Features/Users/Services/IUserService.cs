using AyVino.Api.Features.Users.DTOs;

namespace AyVino.Api.Features.Users.Services;

public interface IUserService
{
    Task<UserResponseDto> RegisterAsync(CreateUserRequestDto dto, CancellationToken ct = default);
    Task<UserResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<UserResponseDto> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<IEnumerable<UserResponseDto>> GetAllAsync(CancellationToken ct = default);
    Task<UserResponseDto> UpdateProfileAsync(int id, UpdateUserProfileRequestDto dto, CancellationToken ct = default);
    Task ChangeStatusAsync(int id, bool isActive, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);

}
