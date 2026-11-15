using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class WineVintageAdminListTests
{
    private readonly IWineVintageRepository _vintageRepo = Substitute.For<IWineVintageRepository>();
    private readonly IWineRepository _wineRepo = Substitute.For<IWineRepository>();
    private readonly IGrapeRepository _grapeRepo = Substitute.For<IGrapeRepository>();
    private readonly IWineryRepository _wineryRepo = Substitute.For<IWineryRepository>();
    private readonly WineVintageService _service;

    public WineVintageAdminListTests()
    {
        _service = new WineVintageService(_vintageRepo, _wineRepo, _grapeRepo, _wineryRepo);
    }

    [Fact]
    public async Task GetPagedForAdminAsync_InvalidStatus_ThrowsValidationException()
    {
        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.GetPagedForAdminAsync(1, 10, "invalid_status"));

        Assert.Equal("Invalid status: 'invalid_status'.", ex.Message);
        await _vintageRepo.DidNotReceiveWithAnyArgs().GetPagedForAdminAsync(default, default, default, default);
    }

    [Fact]
    public async Task GetPagedForAdminAsync_PageNumberZero_ThrowsValidationException()
    {
        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.GetPagedForAdminAsync(0, 10, null));

        Assert.Equal("pageNumber debe ser mayor a 0.", ex.Message);
        await _vintageRepo.DidNotReceiveWithAnyArgs().GetPagedForAdminAsync(default, default, default, default);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(101)]
    public async Task GetPagedForAdminAsync_InvalidPageSize_ThrowsValidationException(int pageSize)
    {
        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.GetPagedForAdminAsync(1, pageSize, null));

        Assert.Equal("pageSize debe estar entre 1 y 100.", ex.Message);
        await _vintageRepo.DidNotReceiveWithAnyArgs().GetPagedForAdminAsync(default, default, default, default);
    }

    [Fact]
    public async Task GetPagedForAdminAsync_StatusPendingLowerCase_Passes1ToRepository()
    {
        // Arrange
        _vintageRepo.GetPagedForAdminAsync(1, 10, 1, Arg.Any<CancellationToken>())
            .Returns(Enumerable.Empty<AdminWineVintageListRow>());

        // Act
        var result = await _service.GetPagedForAdminAsync(1, 10, "pending");

        // Assert
        Assert.NotNull(result);
        await _vintageRepo.Received(1).GetPagedForAdminAsync(1, 10, 1, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetPagedForAdminAsync_StatusNull_PassesNullToRepository()
    {
        // Arrange
        _vintageRepo.GetPagedForAdminAsync(1, 10, null, Arg.Any<CancellationToken>())
            .Returns(Enumerable.Empty<AdminWineVintageListRow>());

        // Act
        var result = await _service.GetPagedForAdminAsync(1, 10, null);

        // Assert
        Assert.NotNull(result);
        await _vintageRepo.Received(1).GetPagedForAdminAsync(1, 10, null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetPagedForAdminAsync_ReturnsMappedDto_WithWineTypeAndApprovalStatusAsString()
    {
        // Arrange
        var registerDate = new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc);
        var rows = new List<AdminWineVintageListRow>
        {
            new()
            {
                VintageId = 101,
                WineId = 42,
                WineName = "Malbec Reserva",
                WineType = WineType.Red,
                WineryId = 7,
                WineryName = "Bodega del Fin del Mundo",
                Year = 2022,
                AlcoholContent = 14.2m,
                ImageId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                ApprovalStatus = ApprovalStatus.Pending,
                UploadedByUserId = 3,
                UploadedByUsername = "sommelier_juan",
                RegisterDate = registerDate
            }
        };

        _vintageRepo.GetPagedForAdminAsync(1, 10, null, Arg.Any<CancellationToken>())
            .Returns(rows);

        // Act
        var result = (await _service.GetPagedForAdminAsync(1, 10, null)).ToList();

        // Assert
        Assert.Single(result);
        var item = result[0];
        Assert.Equal(101, item.VintageId);
        Assert.Equal(42, item.WineId);
        Assert.Equal("Malbec Reserva", item.WineName);
        Assert.Equal("Red", item.WineType);
        Assert.Equal(7, item.WineryId);
        Assert.Equal("Bodega del Fin del Mundo", item.WineryName);
        Assert.Equal(2022, item.Year);
        Assert.Equal(14.2m, item.AlcoholContent);
        Assert.Equal(Guid.Parse("11111111-1111-1111-1111-111111111111"), item.ImageId);
        Assert.Equal("Pending", item.ApprovalStatus);
        Assert.Equal(3, item.UploadedByUserId);
        Assert.Equal("sommelier_juan", item.UploadedByUsername);
        Assert.Equal(registerDate, item.RegisterDate);
    }
}
