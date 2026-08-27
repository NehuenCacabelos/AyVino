using AyVino.Api.Common.Data;
using AyVino.Api.Features.Uvas.Models;
using Dapper;

namespace AyVino.Api.Features.Uvas.Repositories;

public class UvaRepository(IDbConnectionFactory connectionFactory) : IUvaRepository
{
    public async Task<Uva?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Nombre, TipoColor, CuerpoTipico, TaninosTipico, AcidezTipica, Descripcion
            FROM Uvas
            WHERE Id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Uva>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Uva>> GetAllAsync(int pageNumber, int pageSize, int? tipoColor = null, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Nombre, TipoColor, CuerpoTipico, TaninosTipico, AcidezTipica, Descripcion
            FROM Uvas
            WHERE (@TipoColor IS NULL OR TipoColor = @TipoColor)
            ORDER BY Nombre
            OFFSET @Offset LIMIT @PageSize;
            """;
        var offset = (pageNumber - 1) * pageSize;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QueryAsync<Uva>(
            new CommandDefinition(sql, new { TipoColor = tipoColor, Offset = offset, PageSize = pageSize }, cancellationToken: ct));
    }

    public async Task<int> CreateAsync(Uva uva, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO Uvas (Nombre, TipoColor, CuerpoTipico, TaninosTipico, AcidezTipica, Descripcion)
            VALUES (@Nombre, @TipoColor, @CuerpoTipico, @TaninosTipico, @AcidezTipica, @Descripcion)
            RETURNING Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, uva, cancellationToken: ct));
    }

    public async Task<bool> UpdateAsync(Uva uva, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE Uvas
            SET Nombre = @Nombre,
                TipoColor = @TipoColor,
                CuerpoTipico = @CuerpoTipico,
                TaninosTipico = @TaninosTipico,
                AcidezTipica = @AcidezTipica,
                Descripcion = @Descripcion
            WHERE Id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, uva, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM Uvas WHERE Id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS(SELECT 1 FROM Uvas WHERE Id = @Id);";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }
}