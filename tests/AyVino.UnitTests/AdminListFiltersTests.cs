using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Models;
using AyVino.Api.Common.Security;
using AyVino.Api.Common.Security.Hashing;
using AyVino.Api.Common.Security.Jwt;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Locations.Services;
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
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;

namespace AyVino.UnitTests;

public class AdminListFiltersTests
{
    #region Users Filters

    [Theory]
    [InlineData("Admin", "Admin")]
    [InlineData("winery", "Winery")]
    [InlineData("USER", "User")]
    public async Task UserService_GetAllPagedAsync_ValidRole_PassesCanonicalRoleToDataAndCount(string inputRole, string expectedRole)
    {
        var userRepo = Substitute.For<IUserRepository>();
        userRepo.GetAllAsync(2, 15, "juan", expectedRole, null, Arg.Any<CancellationToken>())
            .Returns([new User { Id = 10, Username = "juan", Email = "j@test.com", Role = expectedRole, RegisterDate = DateTime.UtcNow, IsActive = true }]);
        userRepo.CountAsync("juan", expectedRole, null, Arg.Any<CancellationToken>()).Returns(23);

        var service = new UserService(userRepo, Substitute.For<IPasswordHasher>());
        var result = await service.GetAllPagedAsync(2, 15, "  juan  ", inputRole, null);

        Assert.Single(result.Items);
        Assert.Equal(23, result.TotalCount);
        await userRepo.Received(1).GetAllAsync(2, 15, "juan", expectedRole, null, Arg.Any<CancellationToken>());
        await userRepo.Received(1).CountAsync("juan", expectedRole, null, Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData("blocked", false)]
    [InlineData("Blocked", false)]
    [InlineData("active", true)]
    public async Task UserService_GetAllPagedAsync_ValidStatus_MapsBlockedToIsActiveFalse(string inputStatus, bool expectedIsActive)
    {
        var userRepo = Substitute.For<IUserRepository>();
        userRepo.GetAllAsync(1, 10, null, null, expectedIsActive, Arg.Any<CancellationToken>()).Returns([]);
        userRepo.CountAsync(null, null, expectedIsActive, Arg.Any<CancellationToken>()).Returns(4);

        var service = new UserService(userRepo, Substitute.For<IPasswordHasher>());
        var result = await service.GetAllPagedAsync(1, 10, null, null, inputStatus);

        Assert.Equal(4, result.TotalCount);
        await userRepo.Received(1).GetAllAsync(1, 10, null, null, expectedIsActive, Arg.Any<CancellationToken>());
        await userRepo.Received(1).CountAsync(null, null, expectedIsActive, Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData("SuperAdmin")]
    [InlineData("99")]
    public async Task UserService_GetAllPagedAsync_InvalidRole_ThrowsValidationException(string invalidRole)
    {
        var userRepo = Substitute.For<IUserRepository>();
        var service = new UserService(userRepo, Substitute.For<IPasswordHasher>());

        await Assert.ThrowsAsync<ValidationException>(() => service.GetAllPagedAsync(1, 10, null, invalidRole, null));
        await userRepo.DidNotReceiveWithAnyArgs().GetAllAsync(default, default, default, default, default, default);
        await userRepo.DidNotReceiveWithAnyArgs().CountAsync(default, default, default, default);
    }

    [Theory]
    [InlineData("Pending")]
    [InlineData("99")]
    public async Task UserService_GetAllPagedAsync_InvalidStatus_ThrowsValidationException(string invalidStatus)
    {
        var userRepo = Substitute.For<IUserRepository>();
        var service = new UserService(userRepo, Substitute.For<IPasswordHasher>());

        await Assert.ThrowsAsync<ValidationException>(() => service.GetAllPagedAsync(1, 10, null, null, invalidStatus));
        await userRepo.DidNotReceiveWithAnyArgs().GetAllAsync(default, default, default, default, default, default);
        await userRepo.DidNotReceiveWithAnyArgs().CountAsync(default, default, default, default);
    }

    [Fact]
    public async Task UserService_GetAllPagedAsync_NoFilters_PreservesUnfilteredCall()
    {
        var userRepo = Substitute.For<IUserRepository>();
        userRepo.GetAllAsync(1, 10, Arg.Any<CancellationToken>()).Returns([]);
        userRepo.CountAsync(Arg.Any<CancellationToken>()).Returns(50);

        var service = new UserService(userRepo, Substitute.For<IPasswordHasher>());
        var result = await service.GetAllPagedAsync(1, 10, "   ", null, "");

        Assert.Equal(50, result.TotalCount);
        await userRepo.Received(1).GetAllAsync(1, 10, Arg.Any<CancellationToken>());
        await userRepo.Received(1).CountAsync(Arg.Any<CancellationToken>());
    }

    #endregion

    #region Wineries Filters

    [Fact]
    public async Task WineryService_GetAllPagedAsync_SearchWithAdmin_PassesSearchToDataAndCount()
    {
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetAllAsync(2, 10, (int)WineryStatus.Pending, null, "Catena", Arg.Any<CancellationToken>())
            .Returns([new Winery { Id = 3, Name = "Catena Zapata", LocationId = 1, Status = WineryStatus.Pending, RegisterDate = DateTime.UtcNow }]);
        wineryRepo.CountAsync((int)WineryStatus.Pending, null, "Catena", Arg.Any<CancellationToken>()).Returns(1);

        var service = CreateWineryService(wineryRepo);
        var result = await service.GetAllPagedAsync(2, 10, "Pending", null, "  Catena ", new Actor(1, AppRoles.Admin));

        Assert.Single(result.Items);
        Assert.Equal(1, result.TotalCount);
        await wineryRepo.Received(1).GetAllAsync(2, 10, (int)WineryStatus.Pending, null, "Catena", Arg.Any<CancellationToken>());
        await wineryRepo.Received(1).CountAsync((int)WineryStatus.Pending, null, "Catena", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WineryService_GetAllPagedAsync_NonAdminWithSearch_StillForcesApprovedVisibility()
    {
        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetAllAsync(1, 10, (int)WineryStatus.Approved, null, "Catena", Arg.Any<CancellationToken>()).Returns([]);
        wineryRepo.CountAsync((int)WineryStatus.Approved, null, "Catena", Arg.Any<CancellationToken>()).Returns(0);

        var service = CreateWineryService(wineryRepo);
        var result = await service.GetAllPagedAsync(1, 10, "Rejected", null, "Catena", new Actor(5, AppRoles.User));

        Assert.Equal(0, result.TotalCount);
        await wineryRepo.Received(1).GetAllAsync(1, 10, (int)WineryStatus.Approved, null, "Catena", Arg.Any<CancellationToken>());
        await wineryRepo.Received(1).CountAsync((int)WineryStatus.Approved, null, "Catena", Arg.Any<CancellationToken>());
    }

    #endregion

    #region WineVintages Filters

    [Fact]
    public async Task WineVintageService_GetPagedForAdminWithCountAsync_SearchAndStatus_PassesBothToDataAndCount()
    {
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetPagedForAdminAsync(2, 25, (int)ApprovalStatus.Pending, "Malbec", Arg.Any<CancellationToken>()).Returns([]);
        vintageRepo.CountForAdminAsync((int)ApprovalStatus.Pending, "Malbec", Arg.Any<CancellationToken>()).Returns(16);

        var service = new WineVintageService(vintageRepo, Substitute.For<IWineRepository>(), Substitute.For<IGrapeRepository>(), Substitute.For<IWineryRepository>());
        var result = await service.GetPagedForAdminWithCountAsync(2, 25, "Pending", " Malbec ");

        Assert.Equal(16, result.TotalCount);
        await vintageRepo.Received(1).GetPagedForAdminAsync(2, 25, (int)ApprovalStatus.Pending, "Malbec", Arg.Any<CancellationToken>());
        await vintageRepo.Received(1).CountForAdminAsync((int)ApprovalStatus.Pending, "Malbec", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WineVintageService_GetPagedForAdminWithCountAsync_NoSearch_CallsUnfilteredRepoMethod()
    {
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetPagedForAdminAsync(1, 10, null, Arg.Any<CancellationToken>()).Returns([]);
        vintageRepo.CountForAdminAsync(null, Arg.Any<CancellationToken>()).Returns(40);

        var service = new WineVintageService(vintageRepo, Substitute.For<IWineRepository>(), Substitute.For<IGrapeRepository>(), Substitute.For<IWineryRepository>());
        var result = await service.GetPagedForAdminWithCountAsync(1, 10, null, "   ");

        Assert.Equal(40, result.TotalCount);
        await vintageRepo.Received(1).GetPagedForAdminAsync(1, 10, null, Arg.Any<CancellationToken>());
        await vintageRepo.Received(1).CountForAdminAsync(null, Arg.Any<CancellationToken>());
    }

    #endregion

    #region Wines Origin Filter

    [Theory]
    [InlineData("community", SourceType.Community)]
    [InlineData("Official", SourceType.Official)]
    public async Task WineService_GetAllPagedAsync_ValidOrigin_PassesSourceTypeToDataAndCount(string origin, SourceType expectedOrigin)
    {
        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetAllAsync(2, 10, null, null, null, null, 1, true, expectedOrigin, Arg.Any<CancellationToken>())
            .Returns([new Wine { Id = 1, Name = "Vino", WineType = WineType.Red, SourceType = expectedOrigin }]);
        wineRepo.CountAsync(null, null, null, null, 1, true, expectedOrigin, Arg.Any<CancellationToken>()).Returns(12);

        var service = new WineService(wineRepo, Substitute.For<IWineryRepository>(), Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var result = await service.GetAllPagedAsync(2, 10, null, null, null, null, origin, new Actor(1, AppRoles.Admin));

        Assert.Single(result.Items);
        Assert.Equal(12, result.TotalCount);
        await wineRepo.Received(1).GetAllAsync(2, 10, null, null, null, null, 1, true, expectedOrigin, Arg.Any<CancellationToken>());
        await wineRepo.Received(1).CountAsync(null, null, null, null, 1, true, expectedOrigin, Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData("community", SourceType.Community)]
    [InlineData("OFFICIAL", SourceType.Official)]
    public async Task WineService_SearchCatalogPagedAsync_ValidOrigin_PassesSourceTypeAndPreservesVisibility(string origin, SourceType expectedOrigin)
    {
        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.SearchCatalogAsync(null, "malbec", null, null, null, 1, 10, 7, false, null, null, null, expectedOrigin, Arg.Any<CancellationToken>())
            .Returns([]);
        wineRepo.CountSearchCatalogAsync(null, "malbec", null, null, null, 7, false, null, null, null, expectedOrigin, Arg.Any<CancellationToken>())
            .Returns(6);

        var service = new WineService(wineRepo, Substitute.For<IWineryRepository>(), Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());
        var result = await service.SearchCatalogPagedAsync(null, "malbec", null, null, null, 1, 10, new Actor(7, AppRoles.User), null, null, null, origin);

        Assert.Equal(6, result.TotalCount);
        await wineRepo.Received(1).SearchCatalogAsync(null, "malbec", null, null, null, 1, 10, 7, false, null, null, null, expectedOrigin, Arg.Any<CancellationToken>());
        await wineRepo.Received(1).CountSearchCatalogAsync(null, "malbec", null, null, null, 7, false, null, null, null, expectedOrigin, Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData("private")]
    [InlineData("99")]
    public async Task WineService_InvalidOrigin_ThrowsValidationException(string invalidOrigin)
    {
        var wineRepo = Substitute.For<IWineRepository>();
        var service = new WineService(wineRepo, Substitute.For<IWineryRepository>(), Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.GetAllPagedAsync(1, 10, null, null, null, null, invalidOrigin, new Actor(1, AppRoles.Admin)));
        await Assert.ThrowsAsync<ValidationException>(() =>
            service.SearchCatalogPagedAsync(null, "malbec", null, null, null, 1, 10, new Actor(1, AppRoles.Admin), null, null, null, invalidOrigin));

        await wineRepo.DidNotReceiveWithAnyArgs().GetAllAsync(default, default, default, default, default, default, default, default, default(SourceType?), default);
        await wineRepo.DidNotReceiveWithAnyArgs().SearchCatalogAsync(default, default, default, default, default, default, default, default, default, default, default, default, default(SourceType?), default);
    }

    #endregion

    #region Endpoint Query Parameter Binding Tests

    [Fact]
    public async Task FilteredAdminEndpoints_ForwardNewQueryParams_AndWriteTotalCountHeader()
    {
        var userService = Substitute.For<IUserService>();
        userService.GetAllPagedAsync(2, 10, "ana", "Winery", "Blocked", Arg.Any<CancellationToken>())
            .Returns(new PagedResult<UserResponseDto>([], 3));

        var wineryService = Substitute.For<IWineryService>();
        wineryService.GetAllPagedAsync(1, 10, "Pending", null, "Rutini", Arg.Any<Actor?>(), Arg.Any<CancellationToken>())
            .Returns(new PagedResult<WineryResponseDto>([], 2));

        var vintageService = Substitute.For<IWineVintageService>();
        vintageService.GetPagedForAdminWithCountAsync(1, 10, "Pending", "Malbec", Arg.Any<CancellationToken>())
            .Returns(new PagedResult<AdminWineVintageListItemDto>([], 5));

        var wineService = Substitute.For<IWineService>();
        wineService.GetAllPagedAsync(1, 10, null, null, null, null, "community", Arg.Any<Actor?>(), Arg.Any<CancellationToken>())
            .Returns(new PagedResult<WineResponseDto>([], 9));
        wineService.SearchCatalogPagedAsync(null, "Malbec", null, null, null, 1, 10, Arg.Any<Actor?>(), null, null, null, "official", Arg.Any<CancellationToken>())
            .Returns(new PagedResult<CatalogWineItemDto>([], 7));

        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSingleton(userService);
        builder.Services.AddSingleton(wineryService);
        builder.Services.AddSingleton(vintageService);
        builder.Services.AddSingleton(wineService);
        builder.Services.AddSingleton(Substitute.For<AyVino.Api.Features.Cellars.Services.ICellarItemService>());
        builder.Services.AddSingleton(Substitute.For<AyVino.Api.Features.Images.Services.IImageOrchestrator>());
        builder.Services.AddAuthentication();
        builder.Services.AddAuthorization();

        await using var app = builder.Build();
        app.MapUserEndpoints();
        app.MapWineryEndpoints();
        app.MapWineEndpoints();
        app.MapWineVintageEndpoints();

        var endpoints = ((IEndpointRouteBuilder)app).DataSources.SelectMany(ds => ds.Endpoints).OfType<RouteEndpoint>().ToList();

        async Task<string> InvokeHeaderAsync(string routeName, string queryString)
        {
            var endpoint = endpoints.Single(e => e.Metadata.GetMetadata<IEndpointNameMetadata>()?.EndpointName == routeName);
            var ctx = new DefaultHttpContext { RequestServices = app.Services };
            ctx.Request.Method = HttpMethods.Get;
            ctx.Request.QueryString = new QueryString(queryString);
            ctx.User = new ClaimsPrincipal(new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, "1"),
                new Claim(ClaimTypes.Role, AppRoles.Admin)
            ], "Bearer"));
            ctx.Response.Body = new MemoryStream();
            await endpoint.RequestDelegate!(ctx);
            return ctx.Response.Headers["X-Total-Count"].ToString();
        }

        Assert.Equal("3", await InvokeHeaderAsync("GetAllUsers", "?pageNumber=2&pageSize=10&search=ana&role=Winery&status=Blocked"));
        Assert.Equal("2", await InvokeHeaderAsync("GetAllWineries", "?pageNumber=1&pageSize=10&status=Pending&search=Rutini"));
        Assert.Equal("5", await InvokeHeaderAsync("GetWineVintagesForAdmin", "?pageNumber=1&pageSize=10&status=Pending&search=Malbec"));
        Assert.Equal("9", await InvokeHeaderAsync("GetAllWines", "?pageNumber=1&pageSize=10&origin=community"));
        Assert.Equal("7", await InvokeHeaderAsync("SearchWines", "?name=Malbec&origin=official&pageNumber=1&pageSize=10"));
    }

    #endregion

    private static WineryService CreateWineryService(IWineryRepository wineryRepo) =>
        new(
            wineryRepo,
            Substitute.For<ILocationRepository>(),
            Substitute.For<ICityRepository>(),
            Substitute.For<IGeorefClient>(),
            Substitute.For<IUserService>(),
            Substitute.For<IJwtTokenGenerator>());
}
