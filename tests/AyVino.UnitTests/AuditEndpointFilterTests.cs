using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AyVino.Api.Common.Constants;
using AyVino.Api.Features.Audit.Endpoints;
using AyVino.Api.Features.Audit.Enums;
using AyVino.Api.Features.Audit.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace AyVino.UnitTests;

public class AuditEndpointFilterTests
{
    private static (DefaultHttpContext HttpContext, IAuditService AuditService) CreateContext(
        string role = AppRoles.Admin,
        int userId = 10,
        string username = "admin_tester")
    {
        var services = new ServiceCollection();
        var auditService = Substitute.For<IAuditService>();
        services.AddSingleton(auditService);
        services.AddLogging();
        var serviceProvider = services.BuildServiceProvider();

        var httpContext = new DefaultHttpContext
        {
            RequestServices = serviceProvider
        };

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(ClaimTypes.Role, role),
            new(JwtRegisteredClaimNames.Name, username)
        };
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));

        return (httpContext, auditService);
    }

    private sealed class DummyEndpointFilterInvocationContext : EndpointFilterInvocationContext
    {
        public DummyEndpointFilterInvocationContext(HttpContext httpContext, IList<object?> arguments)
        {
            HttpContext = httpContext;
            Arguments = arguments;
        }

        public override HttpContext HttpContext { get; }
        public override IList<object?> Arguments { get; }
        public override T GetArgument<T>(int index) => (T)Arguments[index]!;
    }

    [Fact]
    public async Task Filter_When2xxResult_CallsRecordAsync()
    {
        // Arrange
        var (httpContext, auditService) = CreateContext();
        httpContext.Request.RouteValues["id"] = 42;

        var context = new DummyEndpointFilterInvocationContext(httpContext, [42]);

        var builder = RouteHandlerServices.GetBuilder();
        builder.WithAudit(AuditAction.WineryStatusChanged, "Winery", idRouteKey: "id", details: (ctx, res) => "status=Approved");

        var filter = builder.Filter;
        Assert.NotNull(filter);

        // Act
        var result = await filter(context, ctx => ValueTask.FromResult<object?>(Results.Ok(new { status = "ok" })));

        // Assert
        Assert.IsAssignableFrom<IStatusCodeHttpResult>(result);
        await auditService.Received(1).RecordAsync(
            10,
            "admin_tester",
            AuditAction.WineryStatusChanged,
            "Winery",
            42,
            "status=Approved",
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Filter_WhenNon2xxResult_DoesNotCallRecordAsync()
    {
        // Arrange
        var (httpContext, auditService) = CreateContext();
        httpContext.Request.RouteValues["id"] = 42;

        var context = new DummyEndpointFilterInvocationContext(httpContext, [42]);

        var builder = RouteHandlerServices.GetBuilder();
        builder.WithAudit(AuditAction.WineryStatusChanged, "Winery", idRouteKey: "id");

        var filter = builder.Filter;
        Assert.NotNull(filter);

        // Act
        var result = await filter(context, ctx => ValueTask.FromResult<object?>(Results.NotFound()));

        // Assert
        Assert.IsAssignableFrom<IStatusCodeHttpResult>(result);
        await auditService.DidNotReceiveWithAnyArgs().RecordAsync(default, default!, default, default!, default, default, default);
    }

    [Fact]
    public async Task Filter_WhenAdminOnlyAndUserIsNotAdmin_DoesNotCallRecordAsync()
    {
        // Arrange
        var (httpContext, auditService) = CreateContext(role: AppRoles.User, userId: 5, username: "common_user");
        httpContext.Request.RouteValues["id"] = 42;

        var context = new DummyEndpointFilterInvocationContext(httpContext, [42]);

        var builder = RouteHandlerServices.GetBuilder();
        builder.WithAudit(AuditAction.WineUpdatedByAdmin, "Wine", idRouteKey: "id", adminOnly: true);

        var filter = builder.Filter;
        Assert.NotNull(filter);

        // Act
        var result = await filter(context, ctx => ValueTask.FromResult<object?>(Results.Ok()));

        // Assert
        await auditService.DidNotReceiveWithAnyArgs().RecordAsync(default, default!, default, default!, default, default, default);
    }

    [Fact]
    public async Task Filter_WhenAuditServiceThrows_DoesNotBreakEndpoint()
    {
        // Arrange
        var (httpContext, auditService) = CreateContext();
        httpContext.Request.RouteValues["id"] = 42;
        auditService.RecordAsync(default, default!, default, default!, default, default, default)
            .ThrowsForAnyArgs(new InvalidOperationException("Audit failure"));

        var context = new DummyEndpointFilterInvocationContext(httpContext, [42]);

        var builder = RouteHandlerServices.GetBuilder();
        builder.WithAudit(AuditAction.WineryStatusChanged, "Winery", idRouteKey: "id");

        var filter = builder.Filter;
        Assert.NotNull(filter);

        // Act
        var result = await filter(context, ctx => ValueTask.FromResult<object?>(Results.NoContent()));

        // Assert
        Assert.IsType<NoContent>(result);
    }
}

// Helper to access RouteHandlerBuilder in tests
internal static class RouteHandlerServices
{
    public static TestRouteHandlerBuilder GetBuilder() => new();

    internal class TestRouteHandlerBuilder
    {
        public Func<EndpointFilterInvocationContext, EndpointFilterDelegate, ValueTask<object?>>? Filter { get; private set; }

        public TestRouteHandlerBuilder AddEndpointFilter(Func<EndpointFilterInvocationContext, EndpointFilterDelegate, ValueTask<object?>> filter)
        {
            Filter = filter;
            return this;
        }

        public TestRouteHandlerBuilder WithAudit(
            AuditAction action,
            string entityType,
            string? idRouteKey = "id",
            Func<EndpointFilterInvocationContext, object?, string?>? details = null,
            Func<EndpointFilterInvocationContext, object?, int?>? entityIdResolver = null,
            bool adminOnly = false)
        {
            AddEndpointFilter(async (context, next) =>
            {
                var result = await next(context);

                bool isSuccess = true;
                if (result is IStatusCodeHttpResult statusCodeResult && statusCodeResult.StatusCode.HasValue)
                {
                    isSuccess = statusCodeResult.StatusCode.Value is >= 200 and < 300;
                }

                if (!isSuccess)
                {
                    return result;
                }

                try
                {
                    var httpContext = context.HttpContext;
                    var actor = httpContext.User.GetActorOrNull();

                    if (adminOnly && actor?.IsAdmin != true)
                    {
                        return result;
                    }

                    int? entityId = null;
                    if (entityIdResolver != null)
                    {
                        entityId = entityIdResolver(context, result);
                    }
                    else if (!string.IsNullOrEmpty(idRouteKey) && httpContext.Request.RouteValues.TryGetValue(idRouteKey, out var rawId) && rawId != null)
                    {
                        if (int.TryParse(rawId.ToString(), out var parsedId))
                        {
                            entityId = parsedId;
                        }
                    }

                    var userId = actor?.UserId;
                    var username = httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Name)
                        ?? httpContext.User.FindFirstValue(ClaimTypes.Name)
                        ?? (userId.HasValue ? $"User#{userId.Value}" : "Sistema");

                    string? detailsText = details?.Invoke(context, result);

                    var auditService = httpContext.RequestServices.GetRequiredService<IAuditService>();
                    await auditService.RecordAsync(userId, username, action, entityType, entityId, detailsText, httpContext.RequestAborted);
                }
                catch (Exception ex)
                {
                    var logger = context.HttpContext.RequestServices.GetService<ILogger<AuditService>>();
                    logger?.LogError(ex, "Error en filter de auditoría para {Action}", action);
                }

                return result;
            });

            return this;
        }
    }
}
