using AyVino.Api.Common.Data;
using AyVino.Api.Features.Bodegas.DTOs;
using AyVino.Api.Features.Bodegas.Models;
using Dapper;

namespace AyVino.Api.Features.Bodegas.Repositories;

public class BodegaRepository(IDbConnectionFactory connectionFactory) : IBodegaRepository
{
    public async Task<Bodega?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Nombre, Descripcion, UbicacionId, AnioFundacion, SitioWeb, UsuarioId, Estado, FechaRegistro
            FROM Bodegas
            WHERE Id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Bodega>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<IEnumerable<Bodega>> GetAllAsync(int pageNumber, int pageSize, int? estado = null, int? ubicacionId = null, CancellationToken ct = default)
    {
        const string sql = """
            SELECT Id, Nombre, Descripcion, UbicacionId, AnioFundacion, SitioWeb, UsuarioId, Estado, FechaRegistro
            FROM Bodegas
            WHERE (@Estado IS NULL OR Estado = @Estado)
              AND (@UbicacionId IS NULL OR UbicacionId = @UbicacionId)
            ORDER BY Id
            OFFSET @Offset LIMIT @PageSize;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var offset = (pageNumber - 1) * pageSize;
        return await connection.QueryAsync<Bodega>(
            new CommandDefinition(sql, new { Estado = estado, UbicacionId = ubicacionId, Offset = offset, PageSize = pageSize }, cancellationToken: ct));
    }

    public async Task<Bodega> CreateAsync(int? usuarioId, CreateBodegaRequestDto dto, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO Bodegas (Nombre, Descripcion, UbicacionId, AnioFundacion, SitioWeb, UsuarioId, Estado, FechaRegistro)
            VALUES (@Nombre, @Descripcion, @UbicacionId, @AnioFundacion, @SitioWeb, @UsuarioId, @Estado, @FechaRegistro)
            RETURNING Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);

        var fechaRegistro = DateTime.UtcNow;
        const int estadoPendiente = 1; // EstadoBodega.Pendiente

        var id = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new
            {
                dto.Nombre,
                dto.Descripcion,
                dto.UbicacionId,
                dto.AnioFundacion,
                dto.SitioWeb,
                UsuarioId = usuarioId,
                Estado = estadoPendiente,
                FechaRegistro = fechaRegistro
            }, cancellationToken: ct));

        return new Bodega
        {
            Id = id,
            Nombre = dto.Nombre,
            Descripcion = dto.Descripcion,
            UbicacionId = dto.UbicacionId,
            AnioFundacion = dto.AnioFundacion,
            SitioWeb = dto.SitioWeb,
            UsuarioId = usuarioId,
            Estado = Enums.EstadoBodega.Pendiente,
            FechaRegistro = fechaRegistro
        };
    }

    public async Task<bool> UpdateAsync(int id, UpdateBodegaRequestDto dto, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE Bodegas
            SET Nombre = @Nombre,
                Descripcion = @Descripcion,
                UbicacionId = @UbicacionId,
                AnioFundacion = @AnioFundacion,
                SitioWeb = @SitioWeb
            WHERE Id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id, dto.Nombre, dto.Descripcion, dto.UbicacionId, dto.AnioFundacion, dto.SitioWeb }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> UpdateEstadoAsync(int id, int estado, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE Bodegas
            SET Estado = @Estado
            WHERE Id = @Id;
            """;
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id, Estado = estado }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM Bodegas WHERE Id = @Id;";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        var rowsAffected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = "SELECT EXISTS(SELECT 1 FROM Bodegas WHERE Id = @Id);";
        await using var connection = await connectionFactory.CreateConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }
}