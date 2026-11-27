using System.Data;
using AyVino.Api.Features.Images.Models;

namespace AyVino.Api.Features.Images.Repositories;

public interface IImageRepository
{
    Task<Image?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task InsertAsync(Image image, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default);
    Task InsertAsync(Image image, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
}
