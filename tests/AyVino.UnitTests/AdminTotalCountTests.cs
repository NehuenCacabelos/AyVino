using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Data;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Extensions;
using AyVino.Api.Common.Models;
using AyVino.Api.Common.Security;
using AyVino.Api.Common.Security.Hashing;
using AyVino.Api.Common.Security.Jwt;
using AyVino.Api.Features.Audit.DTOs;
using AyVino.Api.Features.Audit.Endpoints;
using AyVino.Api.Features.Audit.Enums;
using AyVino.Api.Features.Audit.Repositories;
using AyVino.Api.Features.Audit.Services;
using AyVino.Api.Features.Cellars.Services;
using AyVino.Api.Features.Grapes.DTOs;
using AyVino.Api.Features.Grapes.Endpoints;
using AyVino.Api.Features.Grapes.Enums;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Grapes.Services;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Locations.DTOs;
using AyVino.Api.Features.Locations.Endpoints;
using AyVino.Api.Features.Locations.Enums;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Locations.Services;
using AyVino.Api.Features.Pairings.DTOs;
using AyVino.Api.Features.Pairings.Endpoints;
using AyVino.Api.Features.Pairings.Enums;
using AyVino.Api.Features.Pairings.Repositories;
using AyVino.Api.Features.Pairings.Services;
using AyVino.Api.Features.Reviews.DTOs;
using AyVino.Api.Features.Reviews.Endpoints;
using AyVino.Api.Features.Reviews.Repositories;
using AyVino.Api.Features.Reviews.Services;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Endpoints;
using AyVino.Api.Features.Users.Models;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Users.Services;
using AyVino.Api.Features.Wineries.DTOs;
using AyVino.Api.Features.Wineries.Endpoints;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Services;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Endpoints;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AyVino.UnitTests;

public class AdminTotalCountTests
{
    [Fact]
    public void OkWithTotalCount_SetsHeaderAndReturnsOkArray()
    {
        var httpContext = new DefaultHttpContext();
        var items = new[] { "a", "b" };

        var result = httpContext.Response.OkWithTotalCount(items, 42);

        Assert.Equal("42", httpContext.Response.Headers["X-Total-Count"].ToString());
        var okResult = Assert.IsType<Ok<IEnumerable<string>>>(result);
        Assert.Equal(items, okResult.Value);
    }

    #region Service Layer Tests

    [Fact]
    public async Task UserService_GetAllPagedAsync_ReturnsItemsAndTotalCount()
    {
        var userRepo = Substitute.For<IUserRepository>();
        var hasher = Substitute.For<IPasswordHasher>();
        userRepo.GetAllAsync(2, 10, Arg.Any<CancellationToken>())
            .Returns([new User { Id = 1, Username = "u1", Email = "u1@test.com", Role = AppRoles.User, RegisterDate = DateTime.UtcNow, IsActive = true }]);
        userRepo.CountAsync(Arg.Any<CancellationToken>()).Returns(35);

        var service = new UserService(userRepo, hasher);
        var result = await service.GetAllPagedAsync(2, 10);

        Assert.Single(result.Items);
        Assert.Equal(35, result.TotalCount);
    }

    [Fact]
    public async Task WineryService_GetAllPagedAsync_NonAdminForcesApprovedCount()
    {
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetAllAsync(1, 10, (int)WineryStatus.Approved, 3, Arg.Any<CancellationToken>())
            .Returns([new Winery { Id = 1, Name = "Bodega", LocationId = 3, Status = WineryStatus.Approved, RegisterDate = DateTime.UtcNow }]);
        wineryRepo.CountAsync((int)WineryStatus.Approved, 3, Arg.Any<CancellationToken>()).Returns(12);

        var service = new WineryService(
            wineryRepo,
            Substitute.For<ILocationRepository>(),
            Substitute.For<ICityRepository>(),
            Substitute.For<IGeorefClient>(),
            Substitute.For<IUserService>(),
            Substitute.For<IJwtTokenGenerator>());

        var result = await service.GetAllPagedAsync(1, 10, status: "Rejected", locationId: 3, actor: new Actor(5, AppRoles.User));

        Assert.Single(result.Items);
        Assert.Equal(12, result.TotalCount);
        await wineryRepo.Received(1).CountAsync((int)WineryStatus.Approved, 3, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WineryService_GetAllPagedAsync_AdminWithNullStatusCountsAll()
    {
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetAllAsync(1, 10, null, null, Arg.Any<CancellationToken>()).Returns([]);
        wineryRepo.CountAsync(null, null, Arg.Any<CancellationToken>()).Returns(28);

        var service = new WineryService(
            wineryRepo,
            Substitute.For<ILocationRepository>(),
            Substitute.For<ICityRepository>(),
            Substitute.For<IGeorefClient>(),
            Substitute.For<IUserService>(),
            Substitute.For<IJwtTokenGenerator>());

        var result = await service.GetAllPagedAsync(1, 10, status: null, locationId: null, actor: new Actor(1, AppRoles.Admin));

        Assert.Equal(28, result.TotalCount);
        await wineryRepo.Received(1).CountAsync(null, null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WineService_GetAllPagedAsync_PropagatesVisibilityAndFiltersToCount()
    {
        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetAllAsync(1, 10, 4, 2, 2018, 2022, 99, true, Arg.Any<CancellationToken>())
            .Returns([new Wine { Id = 1, Name = "Malbec", WineType = WineType.Red, SourceType = SourceType.Official }]);
        wineRepo.CountAsync(4, 2, 2018, 2022, 99, true, Arg.Any<CancellationToken>()).Returns(19);

        var service = new WineService(wineRepo, Substitute.For<IWineryRepository>(), Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var result = await service.GetAllPagedAsync(1, 10, wineryId: 4, grapeId: 2, yearFrom: 2018, yearTo: 2022, actor: new Actor(99, AppRoles.Admin));

        Assert.Single(result.Items);
        Assert.Equal(19, result.TotalCount);
        await wineRepo.Received(1).CountAsync(4, 2, 2018, 2022, 99, true, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WineService_GetAllPagedAsync_AnonymousUserPassesIsAdminFalseToCount()
    {
        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetAllAsync(1, 10, null, null, null, null, null, false, Arg.Any<CancellationToken>()).Returns([]);
        wineRepo.CountAsync(null, null, null, null, null, false, Arg.Any<CancellationToken>()).Returns(7);

        var service = new WineService(wineRepo, Substitute.For<IWineryRepository>(), Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var result = await service.GetAllPagedAsync(1, 10, actor: null);

        Assert.Equal(7, result.TotalCount);
        await wineRepo.Received(1).CountAsync(null, null, null, null, null, false, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WineService_SearchCatalogPagedAsync_PropagatesFiltersAndActorToCount()
    {
        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.SearchCatalogAsync("malbec", null, null, 2020, WineType.Red, 1, 10, 7, false, 3, 5, 9, Arg.Any<CancellationToken>())
            .Returns([new CatalogWineItemDto(1, 9, null, "Bodega", "Malbec", null, "Red", null, null, null, 2020, null, null, "Official", null, null, 0)]);
        wineRepo.CountSearchCatalogAsync("malbec", null, null, 2020, WineType.Red, 7, false, 3, 5, 9, Arg.Any<CancellationToken>())
            .Returns(14);

        var service = new WineService(wineRepo, Substitute.For<IWineryRepository>(), Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var result = await service.SearchCatalogPagedAsync("malbec", null, null, 2020, "Red", 1, 10, new Actor(7, AppRoles.User), grapeId: 3, stateId: 5, wineryId: 9);

        Assert.Single(result.Items);
        Assert.Equal(14, result.TotalCount);
    }

    [Fact]
    public async Task WineRepository_CountSearchCatalogAsync_ShortQueryReturnsZeroWithoutOpeningConnection()
    {
        var factory = Substitute.For<IDbConnectionFactory>();
        var repo = new WineRepository(factory);

        var total = await repo.CountSearchCatalogAsync("a", null, null, null, null, null, isAdmin: true);

        Assert.Equal(0, total);
        await factory.DidNotReceiveWithAnyArgs().CreateConnectionAsync(default);
    }

    [Fact]
    public async Task WineVintageService_GetPagedForAdminWithCountAsync_PassesParsedStatusToCount()
    {
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetPagedForAdminAsync(1, 10, (int)ApprovalStatus.Pending, Arg.Any<CancellationToken>()).Returns([]);
        vintageRepo.CountForAdminAsync((int)ApprovalStatus.Pending, Arg.Any<CancellationToken>()).Returns(8);

        var service = new WineVintageService(vintageRepo, Substitute.For<IWineRepository>(), Substitute.For<IGrapeRepository>(), Substitute.For<IWineryRepository>());
        var result = await service.GetPagedForAdminWithCountAsync(1, 10, "Pending");

        Assert.Equal(8, result.TotalCount);
        await vintageRepo.Received(1).CountForAdminAsync((int)ApprovalStatus.Pending, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WineVintageService_GetPagedForAdminWithCountAsync_InvalidStatusThrowsValidationException()
    {
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var service = new WineVintageService(vintageRepo, Substitute.For<IWineRepository>(), Substitute.For<IGrapeRepository>(), Substitute.For<IWineryRepository>());

        await Assert.ThrowsAsync<ValidationException>(() => service.GetPagedForAdminWithCountAsync(1, 10, "InvalidStatus"));
        await vintageRepo.DidNotReceiveWithAnyArgs().CountForAdminAsync(default, default);
    }

    [Fact]
    public async Task ReviewService_GetPagedForAdminWithCountAsync_PassesAllFiltersToCount()
    {
        var reviewRepo = Substitute.For<IReviewRepository>();
        reviewRepo.GetPagedForAdminAsync(1, 10, 11, 22, 33, 4.5m, Arg.Any<CancellationToken>()).Returns([]);
        reviewRepo.CountForAdminAsync(11, 22, 33, 4.5m, Arg.Any<CancellationToken>()).Returns(7);

        var service = new ReviewService(reviewRepo, Substitute.For<IWineVintageRepository>());
        var result = await service.GetPagedForAdminWithCountAsync(1, 10, 11, 22, 33, 4.5m);

        Assert.Equal(7, result.TotalCount);
        await reviewRepo.Received(1).CountForAdminAsync(11, 22, 33, 4.5m, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CityService_GetAllPagedAsync_PassesStateAndStatusToCount()
    {
        var cityRepo = Substitute.For<ICityRepository>();
        cityRepo.GetAllAsync(1, 10, 2, (int)CityStatus.Pending, Arg.Any<CancellationToken>()).Returns([]);
        cityRepo.CountAsync(2, (int)CityStatus.Pending, Arg.Any<CancellationToken>()).Returns(5);

        var service = new CityService(cityRepo, Substitute.For<IStateRepository>());
        var result = await service.GetAllPagedAsync(1, 10, 2, "Pending");

        Assert.Equal(5, result.TotalCount);
        await cityRepo.Received(1).CountAsync(2, (int)CityStatus.Pending, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task AuditService_GetPagedWithCountAsync_PassesFiltersToCount()
    {
        var auditRepo = Substitute.For<IAuditRepository>();
        var from = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var to = new DateTime(2026, 1, 31, 0, 0, 0, DateTimeKind.Utc);
        auditRepo.GetPagedAsync(1, 10, (short)AuditAction.WineMerged, "Wine", 5, from, to, Arg.Any<CancellationToken>()).Returns([]);
        auditRepo.CountAsync((short)AuditAction.WineMerged, "Wine", 5, from, to, Arg.Any<CancellationToken>()).Returns(3);

        var service = new AuditService(auditRepo, Substitute.For<ILogger<AuditService>>());
        var result = await service.GetPagedWithCountAsync(1, 10, "WineMerged", "Wine", 5, from, to);

        Assert.Equal(3, result.TotalCount);
        await auditRepo.Received(1).CountAsync((short)AuditAction.WineMerged, "Wine", 5, from, to, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GrapeService_GetAllPagedAsync_PassesColorTypeToCount()
    {
        var grapeRepo = Substitute.For<IGrapeRepository>();
        grapeRepo.GetAllAsync(1, 10, (int)ColorType.Red, Arg.Any<CancellationToken>()).Returns([]);
        grapeRepo.CountAsync((int)ColorType.Red, Arg.Any<CancellationToken>()).Returns(15);

        var service = new GrapeService(grapeRepo);
        var result = await service.GetAllPagedAsync(1, 10, "Red");

        Assert.Equal(15, result.TotalCount);
        await grapeRepo.Received(1).CountAsync((int)ColorType.Red, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task PairingService_GetAllPagedAsync_PassesCategoryToCount()
    {
        var pairingRepo = Substitute.For<IPairingRepository>();
        pairingRepo.GetAllAsync(1, 10, (int)PairingCategory.Meat, Arg.Any<CancellationToken>()).Returns([]);
        pairingRepo.CountAsync((int)PairingCategory.Meat, Arg.Any<CancellationToken>()).Returns(9);

        var service = new PairingService(pairingRepo, Substitute.For<IWineRepository>(), Substitute.For<IWineryRepository>());
        var result = await service.GetAllPagedAsync(1, 10, "Meat");

        Assert.Equal(9, result.TotalCount);
        await pairingRepo.Received(1).CountAsync((int)PairingCategory.Meat, Arg.Any<CancellationToken>());
    }

    #endregion

    #region Endpoint Header Integration Tests

    [Fact]
    public async Task AllAdminListEndpoints_WriteXTotalCountHeader_AndPreserveArrayBody()
    {
        var userService = Substitute.For<IUserService>();
        userService.GetAllPagedAsync(1, 10, null, null, null, Arg.Any<CancellationToken>())
            .Returns(new PagedResult<UserResponseDto>([new UserResponseDto(1, "admin", "a@a.com", "Admin", DateTime.UtcNow, true, null, null)], 11));

        var wineryService = Substitute.For<IWineryService>();
        wineryService.GetAllPagedAsync(1, 10, null, null, null, Arg.Any<Actor?>(), Arg.Any<CancellationToken>())
            .Returns(new PagedResult<WineryResponseDto>([], 22));

        var wineService = Substitute.For<IWineService>();
        wineService.GetAllPagedAsync(1, 10, null, null, null, null, null, Arg.Any<Actor?>(), Arg.Any<CancellationToken>())
            .Returns(new PagedResult<WineResponseDto>([], 33));
        wineService.SearchCatalogPagedAsync(null, "malbec", null, null, null, 1, 10, Arg.Any<Actor?>(), null, null, null, null, Arg.Any<CancellationToken>())
            .Returns(new PagedResult<CatalogWineItemDto>([], 44));

        var vintageService = Substitute.For<IWineVintageService>();
        vintageService.GetPagedForAdminWithCountAsync(1, 10, null, null, Arg.Any<CancellationToken>())
            .Returns(new PagedResult<AdminWineVintageListItemDto>([], 55));

        var reviewService = Substitute.For<IReviewService>();
        reviewService.GetPagedForAdminWithCountAsync(1, 10, null, null, null, null, Arg.Any<CancellationToken>())
            .Returns(new PagedResult<AdminReviewListItemDto>([], 66));

        var cityService = Substitute.For<ICityService>();
        cityService.GetAllPagedAsync(1, 10, null, null, Arg.Any<CancellationToken>())
            .Returns(new PagedResult<CityResponseDto>([], 77));

        var auditService = Substitute.For<IAuditService>();
        auditService.GetPagedWithCountAsync(1, 10, null, null, null, null, null, Arg.Any<CancellationToken>())
            .Returns(new PagedResult<AuditLogEntryDto>([], 88));

        var grapeService = Substitute.For<IGrapeService>();
        grapeService.GetAllPagedAsync(1, 10, null, Arg.Any<CancellationToken>())
            .Returns(new PagedResult<GrapeResponseDto>([], 99));

        var pairingService = Substitute.For<IPairingService>();
        pairingService.GetAllPagedAsync(1, 10, null, Arg.Any<CancellationToken>())
            .Returns(new PagedResult<PairingResponseDto>([], 101));

        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSingleton(userService);
        builder.Services.AddSingleton(wineryService);
        builder.Services.AddSingleton(wineService);
        builder.Services.AddSingleton(vintageService);
        builder.Services.AddSingleton(reviewService);
        builder.Services.AddSingleton(cityService);
        builder.Services.AddSingleton(auditService);
        builder.Services.AddSingleton(grapeService);
        builder.Services.AddSingleton(pairingService);
        builder.Services.AddSingleton(Substitute.For<ICellarItemService>());
        builder.Services.AddSingleton(Substitute.For<IImageOrchestrator>());
        builder.Services.AddAuthentication();
        builder.Services.AddAuthorization();

        await using var app = builder.Build();
        app.MapUserEndpoints();
        app.MapWineryEndpoints();
        app.MapWineEndpoints();
        app.MapWineVintageEndpoints();
        app.MapReviewEndpoints();
        app.MapCityEndpoints();
        app.MapAuditEndpoints();
        app.MapGrapeEndpoints();
        app.MapPairingEndpoints();

        var endpoints = ((IEndpointRouteBuilder)app).DataSources.SelectMany(ds => ds.Endpoints).OfType<RouteEndpoint>().ToList();

        async Task<(string TotalHeader, string Body)> InvokeGetAsync(string routeName, string queryString = "")
        {
            var endpoint = endpoints.Single(e => e.Metadata.GetMetadata<IEndpointNameMetadata>()?.EndpointName == routeName);
            var ctx = new DefaultHttpContext
            {
                RequestServices = app.Services
            };
            ctx.Request.Method = HttpMethods.Get;
            ctx.Request.QueryString = new QueryString(queryString);
            ctx.User = new ClaimsPrincipal(new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, "1"),
                new Claim(ClaimTypes.Role, AppRoles.Admin)
            ], "Bearer"));
            ctx.Response.Body = new MemoryStream();

            await endpoint.RequestDelegate!(ctx);

            ctx.Response.Body.Position = 0;
            using var reader = new StreamReader(ctx.Response.Body);
            var body = await reader.ReadToEndAsync();
            return (ctx.Response.Headers["X-Total-Count"].ToString(), body);
        }

        var (uHeader, uBody) = await InvokeGetAsync("GetAllUsers", "?pageNumber=1&pageSize=10");
        Assert.Equal("11", uHeader);
        Assert.StartsWith("[", uBody.TrimStart());

        var (wyHeader, wyBody) = await InvokeGetAsync("GetAllWineries", "?pageNumber=1&pageSize=10");
        Assert.Equal("22", wyHeader);
        Assert.Equal("[]", wyBody.Trim());

        var (wHeader, wBody) = await InvokeGetAsync("GetAllWines", "?pageNumber=1&pageSize=10");
        Assert.Equal("33", wHeader);
        Assert.Equal("[]", wBody.Trim());

        var (wsHeader, wsBody) = await InvokeGetAsync("SearchWines", "?name=malbec&pageNumber=1&pageSize=10");
        Assert.Equal("44", wsHeader);
        Assert.Equal("[]", wsBody.Trim());

        var (vHeader, vBody) = await InvokeGetAsync("GetWineVintagesForAdmin", "?pageNumber=1&pageSize=10");
        Assert.Equal("55", vHeader);
        Assert.Equal("[]", vBody.Trim());

        var (rHeader, rBody) = await InvokeGetAsync("GetReviewsForAdmin", "?pageNumber=1&pageSize=10");
        Assert.Equal("66", rHeader);
        Assert.Equal("[]", rBody.Trim());

        var (cHeader, cBody) = await InvokeGetAsync("GetAllCities", "?pageNumber=1&pageSize=10");
        Assert.Equal("77", cHeader);
        Assert.Equal("[]", cBody.Trim());

        var (aHeader, aBody) = await InvokeGetAsync("GetAuditLogs", "?pageNumber=1&pageSize=10");
        Assert.Equal("88", aHeader);
        Assert.Equal("[]", aBody.Trim());

        var (gHeader, gBody) = await InvokeGetAsync("GetGrapes", "?pageNumber=1&pageSize=10");
        Assert.Equal("99", gHeader);
        Assert.Equal("[]", gBody.Trim());

        var (pHeader, pBody) = await InvokeGetAsync("GetPairings", "?pageNumber=1&pageSize=10");
        Assert.Equal("101", pHeader);
        Assert.Equal("[]", pBody.Trim());
    }

    #endregion
}
