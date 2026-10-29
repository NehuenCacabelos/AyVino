using System.IO;
using System.Net;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
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
}
