using AyVino.Api.Common.Data;
using AyVino.Api.Features.Users.Models;
using Dapper;

namespace AyVino.Api.Features.Users.Repositories;

public class UserRepository(IDbConnectionFactory connectionFactory) : IUserRepository
{
    public async Task<User?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, username, email, role, register_date, is_active, photo, bio
            FROM users
            WHERE id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<User>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, username, email, role, register_date, is_active, photo, bio
            FROM users
            WHERE LOWER(email) = LOWER(@Email);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<User>(
            new CommandDefinition(sql, new { Email = email }, cancellationToken: ct));
    }

    public async Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, username, email, role, register_date, is_active, photo, bio
            FROM users
            WHERE LOWER(username) = LOWER(@Username);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<User>(
            new CommandDefinition(sql, new { Username = username }, cancellationToken: ct));
    }

    public async Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, username, email, role, register_date, is_active, photo, bio
            FROM users
            ORDER BY id ASC;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<User>(
            new CommandDefinition(sql, cancellationToken: ct));
    }

    public async Task<(User? User, UserCredential? Credential)> GetUserWithCredentialsByEmailAsync(string email, CancellationToken ct = default)
    {
        const string sql = """
            SELECT u.id, u.username, u.email, u.role, u.register_date, u.is_active, u.photo, u.bio,
                   c.user_id, c.password_hash, c.last_password_change, c.failed_login_attempts, c.blocked_until
            FROM users u
            LEFT JOIN user_credentials c ON u.id = c.user_id
            WHERE LOWER(u.email) = LOWER(@Email);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var result = await connection.QueryAsync<User, UserCredential, (User? User, UserCredential? Credential)>(
            new CommandDefinition(sql, new { Email = email }, cancellationToken: ct),
            (user, credential) => (user, credential),
            splitOn: "user_id");

        return result.FirstOrDefault();
    }

    public async Task<int> CreateUserWithCredentialsAsync(User user, UserCredential credential, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            const string insertUserSql = """
                INSERT INTO users (username, email, role, register_date, is_active, photo, bio)
                VALUES (@Username, @Email, @Role, @RegisterDate, @IsActive, @Photo, @Bio)
                RETURNING id;
                """;

            var userId = await connection.ExecuteScalarAsync<int>(
                new CommandDefinition(insertUserSql, user, transaction: transaction, cancellationToken: ct));

            const string insertCredentialSql = """
                INSERT INTO user_credentials (user_id, password_hash, last_password_change, failed_login_attempts, blocked_until)
                VALUES (@UserId, @PasswordHash, @LastPasswordChange, @FailedLoginAttempts, @BlockedUntil);
                """;

            var credentialWithId = credential with { UserId = userId };
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

    public async Task<bool> UpdateProfileAsync(int id, string username, string? bio, string? photo, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE users
            SET username = @Username,
                bio = @Bio,
                photo = @Photo
            WHERE id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id, Username = username, Bio = bio, Photo = photo }, cancellationToken: ct));

        return rowsAffected > 0;
    }

    public async Task<bool> SetIsActiveAsync(int id, bool isActive, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE users
            SET is_active = @IsActive
            WHERE id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id, IsActive = isActive }, cancellationToken: ct));

        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            DELETE FROM users
            WHERE id = @Id;
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
                SELECT 1 FROM users WHERE LOWER(email) = LOWER(@Email)
            );
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Email = email }, cancellationToken: ct));
    }

    public async Task<bool> ExistsByUsernameAsync(string username, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1 FROM users WHERE LOWER(username) = LOWER(@Username)
            );
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Username = username }, cancellationToken: ct));
    }

    public async Task<UserCredential?> GetUserCredentialsByIdAsync(int userId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT user_id, password_hash, last_password_change, failed_login_attempts, blocked_until
            FROM user_credentials
            WHERE user_id = @UserId;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<UserCredential>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task<bool> UpdatePasswordAsync(int userId, string passwordHash, DateTime lastPasswordChange, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_credentials
            SET password_hash = @PasswordHash,
                last_password_change = @LastPasswordChange,
                failed_login_attempts = 0,
                blocked_until = NULL
            WHERE user_id = @UserId;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { UserId = userId, PasswordHash = passwordHash, LastPasswordChange = lastPasswordChange }, cancellationToken: ct));

        return rowsAffected > 0;
    }
}
