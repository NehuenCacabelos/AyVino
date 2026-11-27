using AyVino.Api.Common.Models;
using AyVino.Api.Features.Users.DTOs;

namespace AyVino.Api.Features.Users.Services;

public interface IUserService
{
    Task<UserResponseDto> RegisterAsync(CreateUserRequestDto dto, CancellationToken ct = default);
    Task<UserResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<UserResponseDto> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<PublicUserProfileDto> GetPublicProfileByUsernameAsync(string username, CancellationToken ct = default);
    Task<IEnumerable<UserResponseDto>> GetAllAsync(int pageNumber, int pageSize, CancellationToken ct = default);
    Task<PagedResult<UserResponseDto>> GetAllPagedAsync(int pageNumber, int pageSize, CancellationToken ct = default) =>
        Task.FromResult(new PagedResult<UserResponseDto>([], 0));
    Task<PagedResult<UserResponseDto>> GetAllPagedAsync(int pageNumber, int pageSize, string? search, string? role, string? status, CancellationToken ct = default) =>
        GetAllPagedAsync(pageNumber, pageSize, ct);
    Task<UserResponseDto> UpdateProfileAsync(int id, UpdateUserProfileRequestDto dto, CancellationToken ct = default);
    Task ChangeStatusAsync(int id, bool isActive, CancellationToken ct = default);
    Task ChangeRoleAsync(int actorId, int targetId, string role, CancellationToken ct = default) => Task.CompletedTask;
    Task DeleteAsync(int id, CancellationToken ct = default);
}
