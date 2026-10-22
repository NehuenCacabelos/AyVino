using AyVino.Api.Features.Follows.DTOs;

namespace AyVino.Api.Features.Follows.Services;

public interface IFollowService
{
    Task FollowUserAsync(int followerId, int targetUserId, CancellationToken ct = default);
    Task UnfollowUserAsync(int followerId, int targetUserId, CancellationToken ct = default);
    Task<IReadOnlyList<FollowUserResponseDto>> GetUserFollowersAsync(int userId, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<IReadOnlyList<FollowUserResponseDto>> GetMyFollowingUsersAsync(int followerId, int pageNumber, int pageSize, CancellationToken ct = default);

    Task FollowWineryAsync(int followerId, int wineryId, CancellationToken ct = default);
    Task UnfollowWineryAsync(int followerId, int wineryId, CancellationToken ct = default);
    Task<IReadOnlyList<FollowUserResponseDto>> GetWineryFollowersAsync(int wineryId, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<IReadOnlyList<FollowWineryResponseDto>> GetMyFollowingWineriesAsync(int followerId, int pageNumber, int pageSize, CancellationToken ct = default);
}