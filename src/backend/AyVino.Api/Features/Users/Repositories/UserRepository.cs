using AyVino.Api.Common.Data;
using AyVino.Api.Features.Users.Models;
using Dapper;

namespace AyVino.Api.Features.Users.Repositories;

public class UserRepository(IDbConnectionFactory connectionFactory) : IUserRepository
{
    public async Task<User?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Username, Email, Role, RegisterDate, IsActive, Photo, Bio
            FROM Users
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<User>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Username, Email, Role, RegisterDate, IsActive, Photo, Bio
            FROM Users
            WHERE LOWER(Email) = LOWER(@Email);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<User>(
            new CommandDefinition(sql, new { Email = email }, cancellationToken: ct));
    }

    public async Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Username, Email, Role, RegisterDate, IsActive, Photo, Bio
            FROM Users
            WHERE LOWER(Username) = LOWER(@Username);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<User>(
            new CommandDefinition(sql, new { Username = username }, cancellationToken: ct));
    }

    public async Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Username, Email, Role, RegisterDate, IsActive, Photo, Bio
            FROM Users
            ORDER BY Id ASC;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<User>(
            new CommandDefinition(sql, cancellationToken: ct));
    }

    public async Task<(User? User, UserCredential? Credential)> GetUserWithCredentialsByEmailAsync(string email, CancellationToken ct = default)
    {
        const string sql = """
            SELECT u.Id, u.Username, u.Email, u.Role, u.RegisterDate, u.IsActive, u.Photo, u.Bio,
                   c.UserId, c.PasswordHash, c.LastPasswordChange, c.FailedLoginAttempts, c.BlockedUntil
            FROM Users u
            LEFT JOIN UserCredentials c ON u.Id = c.UserId
            WHERE LOWER(u.Email) = LOWER(@Email);
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var result = await connection.QueryAsync<User, UserCredential, (User? User, UserCredential? Credential)>(
            new CommandDefinition(sql, new { Email = email }, cancellationToken: ct),
            (user, credential) => (user, credential),
            splitOn: "UserId");

        return result.FirstOrDefault();
    }

    public async Task<int> CreateUserWithCredentialsAsync(User user, UserCredential credential, CancellationToken ct = default)
    {
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);

        try
        {
            const string insertUserSql = """
                INSERT INTO Users (Username, Email, Role, RegisterDate, IsActive, Photo, Bio)
                VALUES (@Username, @Email, @Role, @RegisterDate, @IsActive, @Photo, @Bio)
                RETURNING Id;
                """;

            var userId = await connection.ExecuteScalarAsync<int>(
                new CommandDefinition(insertUserSql, user, transaction: transaction, cancellationToken: ct));

            const string insertCredentialSql = """
                INSERT INTO UserCredentials (UserId, PasswordHash, LastPasswordChange, FailedLoginAttempts, BlockedUntil)
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
            UPDATE Users
            SET Username = @Username,
                Bio = @Bio,
                Photo = @Photo
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id, Username = username, Bio = bio, Photo = photo }, cancellationToken: ct));

        return rowsAffected > 0;
    }

    public async Task<bool> SetIsActiveAsync(int id, bool isActive, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE Users
            SET IsActive = @IsActive
            WHERE Id = @Id;
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id, IsActive = isActive }, cancellationToken: ct));

        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            DELETE FROM Users
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
                SELECT 1 FROM Users WHERE LOWER(Email) = LOWER(@Email)
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
                SELECT 1 FROM Users WHERE LOWER(Username) = LOWER(@Username)
            );
            """;

        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Username = username }, cancellationToken: ct));
    }
}
