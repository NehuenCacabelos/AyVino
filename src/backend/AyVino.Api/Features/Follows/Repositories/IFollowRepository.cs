using AyVino.Api.Features.Follows.Models;

namespace AyVino.Api.Features.Follows.Repositories;

public interface IFollowRepository
{
    // Devuelve false si el follow ya existía
    Task<bool> AddUserFollowAsync(int followerId, int followedUserId, CancellationToken ct = default);
    // Devuelve false si el follow no existía
    Task<bool> RemoveUserFollowAsync(int followerId, int followedUserId, CancellationToken ct = default);
    Task<IEnumerable<FollowUserItem>> GetUserFollowersAsync(int userId, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<IEnumerable<FollowUserItem>> GetFollowingUsersAsync(int followerId, int pageNumber, int pageSize, CancellationToken ct = default);

    Task<bool> AddWineryFollowAsync(int followerId, int wineryId, CancellationToken ct = default);
    Task<bool> RemoveWineryFollowAsync(int followerId, int wineryId, CancellationToken ct = default);
    Task<IEnumerable<FollowUserItem>> GetWineryFollowersAsync(int wineryId, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<IEnumerable<FollowWineryItem>> GetFollowingWineriesAsync(int followerId, int pageNumber, int pageSize, CancellationToken ct = default);
}