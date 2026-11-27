using Npgsql;

namespace AyVino.Api.Common.Data;

public interface IDbConnectionFactory
{
    Task<NpgsqlConnection> CreateConnectionAsync(CancellationToken ct = default);
    NpgsqlConnection CreateConnection();
}

