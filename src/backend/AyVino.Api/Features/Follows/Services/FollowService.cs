using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Follows.DTOs;
using AyVino.Api.Features.Follows.Repositories;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Repositories;

namespace AyVino.Api.Features.Follows.Services;

public class FollowService(
    IFollowRepository followRepository,
    IUserRepository userRepository,
    IWineryRepository wineryRepository) : IFollowService
{
    public async Task FollowUserAsync(int followerId, int targetUserId, CancellationToken ct = default)
    {
        if (followerId == targetUserId)
            throw new ValidationException("Un usuario no puede seguirse a sí mismo.");

        await EnsureUserExistsAsync(targetUserId, ct);

        var added = await followRepository.AddUserFollowAsync(followerId, targetUserId, ct);
        if (!added)
            throw new ConflictException($"Ya seguís al usuario con ID {targetUserId}.");
    }

    public async Task UnfollowUserAsync(int followerId, int targetUserId, CancellationToken ct = default)
    {
        var removed = await followRepository.RemoveUserFollowAsync(followerId, targetUserId, ct);
        if (!removed)
            throw new NotFoundException($"No seguís al usuario con ID {targetUserId}.");
    }

    public async Task<IReadOnlyList<FollowUserResponseDto>> GetUserFollowersAsync(int userId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        ValidatePaging(pageNumber, pageSize);
        await EnsureUserExistsAsync(userId, ct);
        var followers = await followRepository.GetUserFollowersAsync(userId, pageNumber, pageSize, ct);
        return followers.ToResponseDtoList();
    }

    public async Task<IReadOnlyList<FollowUserResponseDto>> GetMyFollowingUsersAsync(int followerId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        ValidatePaging(pageNumber, pageSize);
        var following = await followRepository.GetFollowingUsersAsync(followerId, pageNumber, pageSize, ct);
        return following.ToResponseDtoList();
    }

    public async Task FollowWineryAsync(int followerId, int wineryId, CancellationToken ct = default)
    {
        await EnsureWineryApprovedAsync(wineryId, ct);

        var added = await followRepository.AddWineryFollowAsync(followerId, wineryId, ct);
        if (!added)
            throw new ConflictException($"Ya seguís a la bodega con ID {wineryId}.");
    }

    public async Task UnfollowWineryAsync(int followerId, int wineryId, CancellationToken ct = default)
    {
        var removed = await followRepository.RemoveWineryFollowAsync(followerId, wineryId, ct);
        if (!removed)
            throw new NotFoundException($"No seguís a la bodega con ID {wineryId}.");
    }

    public async Task<IReadOnlyList<FollowUserResponseDto>> GetWineryFollowersAsync(int wineryId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        ValidatePaging(pageNumber, pageSize);
        await EnsureWineryApprovedAsync(wineryId, ct);
        var followers = await followRepository.GetWineryFollowersAsync(wineryId, pageNumber, pageSize, ct);
        return followers.ToResponseDtoList();
    }

    public async Task<IReadOnlyList<FollowWineryResponseDto>> GetMyFollowingWineriesAsync(int followerId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        ValidatePaging(pageNumber, pageSize);
        var following = await followRepository.GetFollowingWineriesAsync(followerId, pageNumber, pageSize, ct);
        return following.ToResponseDtoList();
    }

    private async Task EnsureUserExistsAsync(int userId, CancellationToken ct)
    {
        var user = userId > 0 ? await userRepository.GetByIdAsync(userId, ct) : null;
        if (user is null || !user.IsActive)
            throw new NotFoundException($"Usuario con ID {userId} no encontrado.");
    }

    // Una bodega no aprobada no es pública: se responde 404 igual que si no existiera
    private async Task EnsureWineryApprovedAsync(int wineryId, CancellationToken ct)
    {
        var winery = wineryId > 0 ? await wineryRepository.GetByIdAsync(wineryId, ct) : null;
        if (winery is null || winery.Status != WineryStatus.Approved)
            throw new NotFoundException($"Bodega con ID {wineryId} no encontrada.");
    }

    private static void ValidatePaging(int pageNumber, int pageSize)
    {
        if (pageNumber <= 0) throw new ValidationException("pageNumber debe ser mayor a 0.");
        if (pageSize is < 1 or > 100) throw new ValidationException("pageSize debe estar entre 1 y 100.");
    }
}