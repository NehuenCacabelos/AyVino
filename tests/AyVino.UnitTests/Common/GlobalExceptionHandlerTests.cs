using System.IO;
using System.Net;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Npgsql;
using NSubstitute;

namespace AyVino.UnitTests.Common;

public class GlobalExceptionHandlerTests
{
    [Fact]
    public async Task TryHandleAsync_DomainException_SetsProblemJsonContentTypeAndStatusCode()
    {
        var logger = Substitute.For<ILogger<GlobalExceptionHandler>>();
        var handler = new GlobalExceptionHandler(logger);

        var context = new DefaultHttpContext();
        var memoryStream = new MemoryStream();
        context.Response.Body = memoryStream;

        var exception = new NotFoundException("Recurso no encontrado.");

        var result = await handler.TryHandleAsync(context, exception, CancellationToken.None);

        Assert.True(result);
        Assert.Equal((int)HttpStatusCode.NotFound, context.Response.StatusCode);
        Assert.StartsWith("application/problem+json", context.Response.ContentType);

        memoryStream.Seek(0, SeekOrigin.Begin);
        var problem = await JsonSerializer.DeserializeAsync<ProblemDetails>(memoryStream, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(problem);
        Assert.Equal(404, problem.Status);
        Assert.Equal("Recurso no encontrado", problem.Title);
        Assert.Equal("Recurso no encontrado.", problem.Detail);
    }

    [Fact]
    public async Task TryHandleAsync_ForeignKeyPostgresException_TranslatesTo409WithGenericDetailWithoutLeakingSchema()
    {
        // Arrange: PostgresException con nombres de tabla, clave foránea y mensajes internos
        var logger = Substitute.For<ILogger<GlobalExceptionHandler>>();
        var handler = new GlobalExceptionHandler(logger);

        var context = new DefaultHttpContext();
        var memoryStream = new MemoryStream();
        context.Response.Body = memoryStream;

        var exception = new PostgresException(
            messageText: "update or delete on table \"grapes\" violates foreign key constraint \"fk_wine_grapes_grapes\" on table \"wine_grapes\"",
            severity: "ERROR",
            invariantSeverity: "ERROR",
            sqlState: PostgresErrorCodes.ForeignKeyViolation);

        // Act
        var result = await handler.TryHandleAsync(context, exception, CancellationToken.None);

        // Assert
        Assert.True(result);
        Assert.Equal((int)HttpStatusCode.Conflict, context.Response.StatusCode);
        Assert.StartsWith("application/problem+json", context.Response.ContentType);

        memoryStream.Seek(0, SeekOrigin.Begin);
        var problem = await JsonSerializer.DeserializeAsync<ProblemDetails>(memoryStream, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(problem);
        Assert.Equal(409, problem.Status);
        Assert.Equal("Conflicto de recursos", problem.Title);
        // Debe ser un mensaje genérico para el usuario
        Assert.Equal("No se puede eliminar el registro porque tiene otros datos asociados en el sistema.", problem.Detail);
        // Anti-filtración: No debe contener nombres de tablas, de constraints ni texto crudo del motor
        Assert.DoesNotContain("grapes", problem.Detail);
        Assert.DoesNotContain("wine_grapes", problem.Detail);
        Assert.DoesNotContain("fk_", problem.Detail);
        Assert.DoesNotContain("violates foreign key constraint", problem.Detail);
    }
}
