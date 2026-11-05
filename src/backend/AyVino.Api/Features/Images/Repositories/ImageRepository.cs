using System.Data;
using AyVino.Api.Common.Data;
using AyVino.Api.Features.Images.Models;
using Dapper;

namespace AyVino.Api.Features.Images.Repositories;

public class ImageRepository(IDbConnectionFactory connectionFactory) : IImageRepository
{
    public async Task<Image?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        const string sql = """
            SELECT id AS Id, provider AS Provider, external_id AS ExternalId,
                   mime_type AS MimeType, size_bytes AS SizeBytes,
                   width AS Width, height AS Height, created_at AS CreatedAt
            FROM images
            WHERE id = @Id;
            """;
        return await connection.QuerySingleOrDefaultAsync<Image>(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task InsertAsync(Image image, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO images (id, provider, external_id, mime_type, size_bytes, width, height, created_at)
            VALUES (@Id, @Provider, @ExternalId, @MimeType, @SizeBytes, @Width, @Height, @CreatedAt);
            """;
        await connection.ExecuteAsync(new CommandDefinition(sql, image, transaction, cancellationToken: ct));
    }

    public async Task InsertAsync(Image image, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await InsertAsync(image, connection, null, ct);
    }

    public async Task<bool> DeleteAsync(Guid id, IDbConnection connection, IDbTransaction? transaction = null, CancellationToken ct = default)
    {
        const string sql = """
            DELETE FROM images
            WHERE id = @Id;
            """;
        var rows = await connection.ExecuteAsync(new CommandDefinition(sql, new { Id = id }, transaction, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await DeleteAsync(id, connection, null, ct);
    }
}
