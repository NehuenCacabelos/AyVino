using Microsoft.Extensions.Configuration;
using Npgsql;

namespace AyVino.Api.Common.Data;

public class NpgsqlConnectionFactory(IConfiguration configuration) : IDbConnectionFactory
{
    private readonly string _connectionString = string.IsNullOrWhiteSpace(configuration.GetConnectionString("DefaultConnection"))
        ? throw new InvalidOperationException("Configuración de cadena de conexión 'DefaultConnection' no encontrada o vacía. Configure el secreto mediante 'dotnet user-secrets set \"ConnectionStrings:DefaultConnection\" \"<valor>\"' en desarrollo o mediante la variable de entorno 'ConnectionStrings__DefaultConnection' en producción.")
        : configuration.GetConnectionString("DefaultConnection")!;

    public async Task<NpgsqlConnection> CreateConnectionAsync(CancellationToken ct = default)
    {
        var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(ct);
        return connection;
    }

    public NpgsqlConnection CreateConnection()
    {
        var connection = new NpgsqlConnection(_connectionString);
        connection.Open();
        return connection;
    }
}

