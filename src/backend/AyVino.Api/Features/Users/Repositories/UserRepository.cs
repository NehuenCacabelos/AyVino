using AyVino.Api.Common.Data;
using AyVino.Api.Features.Users.Models;
using Dapper;

namespace AyVino.Api.Features.Users.Repositories;

public class UserRepository(IDbConnectionFactory connectionFactory) : IUserRepository
{
    public async Task<User?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, NombreUsuario, Email, Rol, FechaRegistro, Activo, FotoPerfil, Bio
            FROM Usuarios
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<User>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, NombreUsuario, Email, Rol, FechaRegistro, Activo, FotoPerfil, Bio
            FROM Usuarios
            WHERE LOWER(Email) = LOWER(@Email);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<User>(
            new CommandDefinition(sql, new { Email = email }, cancellationToken: ct));
    }

    public async Task<User?> GetByNombreUsuarioAsync(string nombreUsuario, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, NombreUsuario, Email, Rol, FechaRegistro, Activo, FotoPerfil, Bio
            FROM Usuarios
            WHERE LOWER(NombreUsuario) = LOWER(@NombreUsuario);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<User>(
            new CommandDefinition(sql, new { NombreUsuario = nombreUsuario }, cancellationToken: ct));
    }

    public async Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, NombreUsuario, Email, Rol, FechaRegistro, Activo, FotoPerfil, Bio
            FROM Usuarios
            ORDER BY Id ASC;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<User>(
            new CommandDefinition(sql, cancellationToken: ct));
    }

    public async Task<int> CreateUserWithCredentialsAsync(User user, UserCredential credential, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            const string insertUserSql = """
                INSERT INTO Usuarios (NombreUsuario, Email, Rol, FechaRegistro, Activo, FotoPerfil, Bio)
                VALUES (@NombreUsuario, @Email, @Rol, @FechaRegistro, @Activo, @FotoPerfil, @Bio)
                RETURNING Id;
                """;

            var userId = await connection.ExecuteScalarAsync<int>(
                new CommandDefinition(insertUserSql, user, transaction: transaction, cancellationToken: ct));

            const string insertCredentialSql = """
                INSERT INTO Credenciales (UsuarioId, PasswordHash, UltimoCambioPassword, IntentosFallidos, BloqueadoHasta)
                VALUES (@UsuarioId, @PasswordHash, @UltimoCambioPassword, @IntentosFallidos, @BloqueadoHasta);
                """;

            var credentialWithId = credential with { UsuarioId = userId };
            await connection.ExecuteAsync(
                new CommandDefinition(insertCredentialSql, credentialWithId, transaction: transaction, cancellationToken: ct));

            await transaction.CommitAsync(ct);
            return userId;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<bool> UpdateProfileAsync(int id, string nombreUsuario, string? bio, string? fotoPerfil, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE Usuarios
            SET NombreUsuario = @NombreUsuario,
                Bio = @Bio,
                FotoPerfil = @FotoPerfil
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id, NombreUsuario = nombreUsuario, Bio = bio, FotoPerfil = fotoPerfil }, cancellationToken: ct));

        return rowsAffected > 0;
    }

    public async Task<bool> SetActivoAsync(int id, bool activo, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE Usuarios
            SET Activo = @Activo
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id, Activo = activo }, cancellationToken: ct));

        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            DELETE FROM Usuarios
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));

        return rowsAffected > 0;
    }

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1 FROM Usuarios WHERE LOWER(Email) = LOWER(@Email)
            );
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Email = email }, cancellationToken: ct));
    }

    public async Task<bool> ExistsByNombreUsuarioAsync(string nombreUsuario, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1 FROM Usuarios WHERE LOWER(NombreUsuario) = LOWER(@NombreUsuario)
            );
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { NombreUsuario = nombreUsuario }, cancellationToken: ct));
    }
}

