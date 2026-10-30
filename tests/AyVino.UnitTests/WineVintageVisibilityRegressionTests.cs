using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class WineVintageVisibilityRegressionTests
{
    private readonly IWineVintageRepository _vintageRepo = Substitute.For<IWineVintageRepository>();
    private readonly IWineRepository _wineRepo = Substitute.For<IWineRepository>();
    private readonly IGrapeRepository _grapeRepo = Substitute.For<IGrapeRepository>();
    private readonly IWineryRepository _wineryRepo = Substitute.For<IWineryRepository>();
    private readonly WineVintageService _service;

    public WineVintageVisibilityRegressionTests()
    {
        _service = new WineVintageService(_vintageRepo, _wineRepo, _grapeRepo, _wineryRepo);
    }

    private static WineVintage CreateVintage(int id, int wineId, int uploaderId, ApprovalStatus status) => new()
    {
        Id = id,
        WineId = wineId,
        Year = 2021,
        AlcoholContent = 13.5m,
        ServingTemperature = 16,
        ApprovalStatus = status,
        UploadedByUserId = uploaderId,
        RegisterDate = DateTime.UtcNow
    };

    private static Wine CreateWine(int id, int? wineryId) => new()
    {
        Id = id,
        WineryId = wineryId,
        Name = "Vino de Prueba",
        WineType = WineType.Red,
        SourceType = wineryId.HasValue ? SourceType.Official : SourceType.Community
    };

    private static Winery CreateWinery(int id, int userId, WineryStatus status) => new()
    {
        Id = id,
        UserId = userId,
        Name = "Bodega de Prueba",
        LocationId = 1,
        Status = status,
        RegisterDate = DateTime.UtcNow
    };

    #region Cosecha Pending / Rejected: Visibilidad

    [Theory]
    [InlineData(ApprovalStatus.Pending)]
    [InlineData(ApprovalStatus.Rejected)]
    public async Task GetByIdAsync_PendingOrRejected_AnonymousAndUnrelatedUser_ThrowsNotFoundException(ApprovalStatus status)
    {
        // Arrange
        var wine = CreateWine(id: 1, wineryId: null);
        var vintage = CreateVintage(id: 10, wineId: 1, uploaderId: 100, status: status);

        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(vintage);

        // Act & Assert 1: Anónimo
        await Assert.ThrowsAsync<NotFoundException>(() => _service.GetByIdAsync(1, 10, actor: null));

        // Act & Assert 2: Usuario ajeno (ID 999)
        var unrelatedActor = new Actor(999, AppRoles.User);
        await Assert.ThrowsAsync<NotFoundException>(() => _service.GetByIdAsync(1, 10, unrelatedActor));
    }

    [Theory]
    [InlineData(ApprovalStatus.Pending)]
    [InlineData(ApprovalStatus.Rejected)]
    public async Task GetAllByWineIdAsync_PendingOrRejected_AnonymousAndUnrelatedUser_FiltersOut(ApprovalStatus status)
    {
        // Arrange
        var wine = CreateWine(id: 1, wineryId: null);
        var vintage = CreateVintage(id: 10, wineId: 1, uploaderId: 100, status: status);

        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);
        _vintageRepo.GetAllByWineIdAsync(1, Arg.Any<CancellationToken>()).Returns([vintage]);

        // Act & Assert 1: Anónimo no ve la cosecha
        var anonResults = await _service.GetAllByWineIdAsync(1, actor: null);
        Assert.Empty(anonResults);

        // Act & Assert 2: Usuario ajeno no ve la cosecha
        var unrelatedActor = new Actor(999, AppRoles.User);
        var unrelatedResults = await _service.GetAllByWineIdAsync(1, unrelatedActor);
        Assert.Empty(unrelatedResults);
    }

    [Theory]
    [InlineData(ApprovalStatus.Pending)]
    [InlineData(ApprovalStatus.Rejected)]
    public async Task GetByIdAsync_PendingOrRejected_UploaderWineryOwnerAndAdmin_CanView(ApprovalStatus status)
    {
        // Arrange: Vino de una bodega (ID 50, dueña user ID 200), uploader user ID 100
        var winery = CreateWinery(id: 50, userId: 200, status: WineryStatus.Approved);
        var wine = CreateWine(id: 1, wineryId: 50);
        var vintage = CreateVintage(id: 10, wineId: 1, uploaderId: 100, status: status);

        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);
        _wineryRepo.GetByIdAsync(50, Arg.Any<CancellationToken>()).Returns(winery);
        _vintageRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(vintage);
        _vintageRepo.GetGrapesByVintageIdAsync(10, Arg.Any<CancellationToken>()).Returns([]);

        // 1. Uploader (ID 100)
        var uploaderActor = new Actor(100, AppRoles.User);
        var uploaderRes = await _service.GetByIdAsync(1, 10, uploaderActor);
        Assert.NotNull(uploaderRes);
        Assert.Equal(10, uploaderRes.Id);

        // 2. Dueño de bodega (ID 200)
        var ownerActor = new Actor(200, AppRoles.Winery);
        var ownerRes = await _service.GetByIdAsync(1, 10, ownerActor);
        Assert.NotNull(ownerRes);
        Assert.Equal(10, ownerRes.Id);

        // 3. Administrador
        var adminActor = new Actor(1, AppRoles.Admin);
        var adminRes = await _service.GetByIdAsync(1, 10, adminActor);
        Assert.NotNull(adminRes);
        Assert.Equal(10, adminRes.Id);
    }

    [Theory]
    [InlineData(ApprovalStatus.Pending)]
    [InlineData(ApprovalStatus.Rejected)]
    public async Task GetAllByWineIdAsync_PendingOrRejected_UploaderWineryOwnerAndAdmin_CanView(ApprovalStatus status)
    {
        // Arrange
        var winery = CreateWinery(id: 50, userId: 200, status: WineryStatus.Approved);
        var wine = CreateWine(id: 1, wineryId: 50);
        var vintage = CreateVintage(id: 10, wineId: 1, uploaderId: 100, status: status);

        _wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(wine);
        _wineryRepo.GetByIdAsync(50, Arg.Any<CancellationToken>()).Returns(winery);
        _vintageRepo.GetAllByWineIdAsync(1, Arg.Any<CancellationToken>()).Returns([vintage]);
        _vintageRepo.GetGrapesByVintageIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>()).Returns([]);

        // 1. Uploader (ID 100)
        var uploaderRes = (await _service.GetAllByWineIdAsync(1, new Actor(100, AppRoles.User))).ToList();
        Assert.Single(uploaderRes);

        // 2. Dueño de bodega (ID 200)
        var ownerRes = (await _service.GetAllByWineIdAsync(1, new Actor(200, AppRoles.Winery))).ToList();
        Assert.Single(ownerRes);

        // 3. Admin
        var adminRes = (await _service.GetAllByWineIdAsync(1, new Actor(1, AppRoles.Admin))).ToList();
        Assert.Single(adminRes);
    }

    #endregion

    #region Cosecha Approved de Bodega NO Aprobada (Pending / Rejected)

    [Theory]
    [InlineData(WineryStatus.Pending)]
    [InlineData(WineryStatus.Rejected)]
    public async Task ApprovedVintage_OfUnapprovedWinery_AnonymousCannotView_OwnerAndAdminCan(WineryStatus wineryStatus)
    {
        // Arrange
        var winery = CreateWinery(id: 77, userId: 300, status: wineryStatus);
        var wine = CreateWine(id: 5, wineryId: 77);
        var vintage = CreateVintage(id: 50, wineId: 5, uploaderId: 300, status: ApprovalStatus.Approved);

        _wineRepo.GetByIdAsync(5, Arg.Any<CancellationToken>()).Returns(wine);
        _wineryRepo.GetByIdAsync(77, Arg.Any<CancellationToken>()).Returns(winery);
        _vintageRepo.GetByIdAsync(50, Arg.Any<CancellationToken>()).Returns(vintage);
        _vintageRepo.GetAllByWineIdAsync(5, Arg.Any<CancellationToken>()).Returns([vintage]);
        _vintageRepo.GetGrapesByVintageIdAsync(50, Arg.Any<CancellationToken>()).Returns([]);
        _vintageRepo.GetGrapesByVintageIdsAsync(Arg.Any<IEnumerable<int>>(), Arg.Any<CancellationToken>()).Returns([]);

        // 1. Anónimo -> Detalle lanza NotFound y Listado lanza NotFound
        await Assert.ThrowsAsync<NotFoundException>(() => _service.GetByIdAsync(5, 50, actor: null));
        await Assert.ThrowsAsync<NotFoundException>(() => _service.GetAllByWineIdAsync(5, actor: null));

        // 2. Dueño de bodega (ID 300) -> Puede ver detalle y listado
        var ownerActor = new Actor(300, AppRoles.Winery);
        var ownerDetail = await _service.GetByIdAsync(5, 50, ownerActor);
        Assert.NotNull(ownerDetail);
        var ownerList = (await _service.GetAllByWineIdAsync(5, ownerActor)).ToList();
        Assert.Single(ownerList);

        // 3. Admin -> Puede ver detalle y listado
        var adminActor = new Actor(1, AppRoles.Admin);
        var adminDetail = await _service.GetByIdAsync(5, 50, adminActor);
        Assert.NotNull(adminDetail);
        var adminList = (await _service.GetAllByWineIdAsync(5, adminActor)).ToList();
        Assert.Single(adminList);
    }

    #endregion

    #region Moderación Administrativa: GetOwnedVintageOrThrowAsync con cualquier estado

    [Theory]
    [InlineData(ApprovalStatus.Pending, ApprovalStatus.Approved)]
    [InlineData(ApprovalStatus.Rejected, ApprovalStatus.Approved)]
    [InlineData(ApprovalStatus.Approved, ApprovalStatus.Rejected)]
    public async Task ChangeStatusAsync_AdminModeration_RetrievesAndUpdatesAnyStatus(
        ApprovalStatus initialStatus,
        ApprovalStatus targetStatus)
    {
        // Arrange: La cosecha comienza en initialStatus (ej: Pending o Rejected)
        var vintage = CreateVintage(id: 15, wineId: 2, uploaderId: 10, status: initialStatus);
        var updatedVintage = vintage with { ApprovalStatus = targetStatus };

        _vintageRepo.GetByIdAsync(15, Arg.Any<CancellationToken>())
            .Returns(vintage, updatedVintage); // Primero devuelve la existente, luego la actualizada
        _vintageRepo.UpdateStatusAsync(15, (int)targetStatus, Arg.Any<CancellationToken>())
            .Returns(true);
        _vintageRepo.GetGrapesByVintageIdAsync(15, Arg.Any<CancellationToken>())
            .Returns([]);

        // Act: El admin cambia el estado de moderación
        var result = await _service.ChangeStatusAsync(2, 15, new ChangeWineVintageStatusRequestDto(targetStatus.ToString()));

        // Assert: GetOwnedVintageOrThrowAsync cargó la cosecha sin fallar y se actualizó exitosamente
        Assert.NotNull(result);
        Assert.Equal(targetStatus.ToString(), result.ApprovalStatus);
        await _vintageRepo.Received(1).UpdateStatusAsync(15, (int)targetStatus, Arg.Any<CancellationToken>());
    }

    #endregion
}
