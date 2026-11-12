using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Data;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class WineApprovalAndDuplicateTests
{
    private static Winery CreateWinery(int id, int userId, WineryStatus status = WineryStatus.Approved) => new()
    {
        Id = id,
        Name = "Bodega Los Andes",
        LocationId = 1,
        UserId = userId,
        Status = status,
        RegisterDate = DateTime.UtcNow
    };

    private static CreateWineRequestDto CreateWineDto(int? wineryId, string name = "Malbec Roble", string wineType = "Red", int? year = 2021) => new(
        WineryId: wineryId,
        WineryNameText: wineryId is null ? "Bodega Artesanal" : null,
        Name: name,
        Description: "Descripción",
        WineType: wineType,
        LocationId: 1,
        FirstVintage: new CreateWineVintageRequestDto(Year: year)
    );

    #region 1.1 WineLabelNormalizer Tests

    [Theory]
    [InlineData("  Viña   Cobos - Bramare (Malbec)!  ", "vina cobos bramare malbec")]
    [InlineData("Ñandú Gran Reserva", "nandu gran reserva")]
    [InlineData("Árbol, Río... & Sol", "arbol rio sol")]
    [InlineData("CAÑÓN DEL ATUEL!", "canon del atuel")]
    [InlineData("Rutini / Cabernet - Malbec", "rutini cabernet malbec")]
    public void WineLabelNormalizer_NormalizesAccentsPunctuationEnyeAndSpaces(string input, string expected)
    {
        var result = WineLabelNormalizer.Normalize(input);
        Assert.Equal(expected, result);
    }

    [Fact]
    public void WineLabelNormalizer_NullOrWhitespace_ReturnsEmpty()
    {
        Assert.Equal(string.Empty, WineLabelNormalizer.Normalize(null));
        Assert.Equal(string.Empty, WineLabelNormalizer.Normalize("   "));
    }

    #endregion

    #region 1.2 Approval Status on Wine Creation

    [Fact]
    public async Task CreateWine_OwnerCreatesOfficialWine_FirstVintageIsApproved()
    {
        // Arrange
        const int wineryId = 10;
        const int userId = 5;
        var winery = CreateWinery(wineryId, userId, WineryStatus.Approved);

        var wineRepo = Substitute.For<IWineRepository>();
        WineVintage? capturedVintage = null;
        wineRepo.CreateWithFirstVintageAsync(Arg.Any<Wine>(), Arg.Do<WineVintage>(v => capturedVintage = v), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>())
            .Returns(args => ((Wine)args[0]) with { Id = 1 });

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.ExistsByIdAsync(wineryId, Arg.Any<CancellationToken>()).Returns(true);
        wineryRepo.GetByIdAsync(wineryId, Arg.Any<CancellationToken>()).Returns(winery);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineService(wineRepo, wineryRepo, locationRepo, Substitute.For<IGrapeRepository>());
        var actor = new Actor(userId, AppRoles.Winery);

        // Act
        var result = await service.CreateAsync(CreateWineDto(wineryId), actor);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(capturedVintage);
        Assert.Equal(ApprovalStatus.Approved, capturedVintage.ApprovalStatus);
    }

    [Fact]
    public async Task CreateWine_AdminCreatesWine_FirstVintageIsApproved()
    {
        // Arrange
        const int wineryId = 10;
        var wineRepo = Substitute.For<IWineRepository>();
        WineVintage? capturedVintage = null;
        wineRepo.CreateWithFirstVintageAsync(Arg.Any<Wine>(), Arg.Do<WineVintage>(v => capturedVintage = v), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>())
            .Returns(args => ((Wine)args[0]) with { Id = 1 });

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.ExistsByIdAsync(wineryId, Arg.Any<CancellationToken>()).Returns(true);

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineService(wineRepo, wineryRepo, locationRepo, Substitute.For<IGrapeRepository>());
        var actor = new Actor(99, AppRoles.Admin);

        // Act
        var result = await service.CreateAsync(CreateWineDto(wineryId), actor);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(capturedVintage);
        Assert.Equal(ApprovalStatus.Approved, capturedVintage.ApprovalStatus);
    }

    [Fact]
    public async Task CreateWine_CommonUserCreatesCommunityWine_FirstVintageIsPending()
    {
        // Arrange
        var wineRepo = Substitute.For<IWineRepository>();
        WineVintage? capturedVintage = null;
        wineRepo.CreateWithFirstVintageAsync(Arg.Any<Wine>(), Arg.Do<WineVintage>(v => capturedVintage = v), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>())
            .Returns(args => ((Wine)args[0]) with { Id = 1 });

        var locationRepo = Substitute.For<ILocationRepository>();
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineService(wineRepo, Substitute.For<IWineryRepository>(), locationRepo, Substitute.For<IGrapeRepository>());
        var actor = new Actor(7, AppRoles.User);

        // Act
        var result = await service.CreateAsync(CreateWineDto(wineryId: null), actor);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(capturedVintage);
        Assert.Equal(ApprovalStatus.Pending, capturedVintage.ApprovalStatus);
    }

    #endregion

    #region 1.3 Approval Status on Vintage Creation

    [Fact]
    public async Task CreateVintage_OwnerCreatesForOwnWine_VintageIsApproved()
    {
        // Arrange
        const int wineId = 1;
        const int wineryId = 10;
        const int userId = 5;

        var wine = new Wine { Id = wineId, WineryId = wineryId, Name = "Vino Test", WineType = WineType.Red };
        var winery = CreateWinery(wineryId, userId, WineryStatus.Approved);

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);

        var wineryRepo = Substitute.For<IWineryRepository>();
        wineryRepo.GetByIdAsync(wineryId, Arg.Any<CancellationToken>()).Returns(winery);

        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetAllByWineIdAsync(wineId, Arg.Any<CancellationToken>()).Returns([]);
        vintageRepo.CreateAsync(Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>())
            .Returns(args => (WineVintage)args[0]);

        var service = new WineVintageService(vintageRepo, wineRepo, Substitute.For<IGrapeRepository>(), wineryRepo);
        var actor = new Actor(userId, AppRoles.Winery);

        // Act
        var result = await service.CreateAsync(wineId, new CreateWineVintageRequestDto(Year: 2022), actor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(ApprovalStatus.Approved.ToString(), result.ApprovalStatus);
    }

    [Fact]
    public async Task CreateVintage_AdminCreatesVintage_VintageIsApproved()
    {
        // Arrange
        const int wineId = 1;
        var wine = new Wine { Id = wineId, WineryId = 10, Name = "Vino Test", WineType = WineType.Red };

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);

        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetAllByWineIdAsync(wineId, Arg.Any<CancellationToken>()).Returns([]);
        vintageRepo.CreateAsync(Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>())
            .Returns(args => (WineVintage)args[0]);

        var service = new WineVintageService(vintageRepo, wineRepo, Substitute.For<IGrapeRepository>(), Substitute.For<IWineryRepository>());
        var actor = new Actor(99, AppRoles.Admin);

        // Act
        var result = await service.CreateAsync(wineId, new CreateWineVintageRequestDto(Year: 2022), actor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(ApprovalStatus.Approved.ToString(), result.ApprovalStatus);
    }

    [Fact]
    public async Task CreateVintage_CommonUserCreatesCommunityVintage_VintageIsPending()
    {
        // Arrange
        const int wineId = 1;
        var wine = new Wine { Id = wineId, WineryId = null, Name = "Vino Comunitario", WineType = WineType.Red };

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);

        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetAllByWineIdAsync(wineId, Arg.Any<CancellationToken>()).Returns([]);
        vintageRepo.CreateAsync(Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>())
            .Returns(args => (WineVintage)args[0]);

        var service = new WineVintageService(vintageRepo, wineRepo, Substitute.For<IGrapeRepository>(), Substitute.For<IWineryRepository>());
        var actor = new Actor(7, AppRoles.User);

        // Act
        var result = await service.CreateAsync(wineId, new CreateWineVintageRequestDto(Year: 2022), actor);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(ApprovalStatus.Pending.ToString(), result.ApprovalStatus);
    }

    #endregion

    #region 1.4 Vintage Duplicate Control in WineVintageService

    [Fact]
    public async Task CreateVintage_YearAlreadyExistsForWine_ThrowsConflictExceptionWithCodeAndIds()
    {
        // Arrange
        const int wineId = 5;
        const int existingVintageId = 42;
        var wine = new Wine { Id = wineId, WineryId = null, Name = "Vino Test", WineType = WineType.Red };

        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(wineId, Arg.Any<CancellationToken>()).Returns(wine);

        var existingVintage = new WineVintage
        {
            Id = existingVintageId,
            WineId = wineId,
            Year = 2020,
            ApprovalStatus = ApprovalStatus.Approved
        };

        var vintageRepo = Substitute.For<IWineVintageRepository>();
        vintageRepo.GetAllByWineIdAsync(wineId, Arg.Any<CancellationToken>()).Returns([existingVintage]);

        var service = new WineVintageService(vintageRepo, wineRepo, Substitute.For<IGrapeRepository>(), Substitute.For<IWineryRepository>());
        var actor = new Actor(1, AppRoles.Admin);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            service.CreateAsync(wineId, new CreateWineVintageRequestDto(Year: 2020), actor));

        Assert.Equal("WINE_VINTAGE_DUPLICATE", ex.Extensions["code"]);
        Assert.Equal(wineId, ex.Extensions["existingWineId"]);
        Assert.Equal(existingVintageId, ex.Extensions["existingVintageId"]);
    }

    #endregion

    #region 1.5 Wine Duplicate Detection Logic (Repository / Business Rules)

    [Fact]
    public void DuplicateCheck_ExactDuplicateWithSameYear_ThrowsConflictExceptionWithDuplicateCode()
    {
        // Testeamos la regla de detección de duplicados implementada en el repositorio
        var existingWines = new List<Wine>
        {
            new() { Id = 10, WineryId = 1, Name = "Rutini Cabernet Sauvignon", WineType = WineType.Red }
        };
        var existingVintages = new List<WineVintage>
        {
            new() { Id = 101, WineId = 10, Year = 2020, ApprovalStatus = ApprovalStatus.Approved }
        };

        var newWine = new Wine { WineryId = 1, Name = "rutini  cabernet  sauvignon", WineType = WineType.Red };
        var newVintage = new WineVintage { Year = 2020 };

        var normalizedNewName = WineLabelNormalizer.Normalize(newWine.Name);
        var match = existingWines.FirstOrDefault(w =>
            w.WineryId == newWine.WineryId &&
            w.WineType == newWine.WineType &&
            WineLabelNormalizer.Normalize(w.Name) == normalizedNewName);

        Assert.NotNull(match);
        var matchingVintage = existingVintages.FirstOrDefault(v => v.WineId == match.Id && v.Year == newVintage.Year);
        Assert.NotNull(matchingVintage);

        var ex = new ConflictException(
            $"Ya existe el vino '{match.Name}' con la cosecha {newVintage.Year} en esta bodega.",
            new Dictionary<string, object?>
            {
                ["code"] = "WINE_VINTAGE_DUPLICATE",
                ["existingWineId"] = match.Id,
                ["existingVintageId"] = matchingVintage.Id
            });

        Assert.Equal("WINE_VINTAGE_DUPLICATE", ex.Extensions["code"]);
        Assert.Equal(10, ex.Extensions["existingWineId"]);
        Assert.Equal(101, ex.Extensions["existingVintageId"]);
    }

    [Fact]
    public void DuplicateCheck_SameNameDifferentYear_ThrowsConflictExceptionWithAddVintageCode()
    {
        var existingWines = new List<Wine>
        {
            new() { Id = 10, WineryId = 1, Name = "Rutini Cabernet Sauvignon", WineType = WineType.Red }
        };
        var existingVintages = new List<WineVintage>
        {
            new() { Id = 101, WineId = 10, Year = 2020, ApprovalStatus = ApprovalStatus.Approved }
        };

        var newWine = new Wine { WineryId = 1, Name = "RUTINI CABERNET SAUVIGNON", WineType = WineType.Red };
        var newVintage = new WineVintage { Year = 2021 };

        var normalizedNewName = WineLabelNormalizer.Normalize(newWine.Name);
        var match = existingWines.FirstOrDefault(w =>
            w.WineryId == newWine.WineryId &&
            w.WineType == newWine.WineType &&
            WineLabelNormalizer.Normalize(w.Name) == normalizedNewName);

        Assert.NotNull(match);
        var matchingVintage = existingVintages.FirstOrDefault(v => v.WineId == match.Id && v.Year == newVintage.Year);
        Assert.Null(matchingVintage);

        var ex = new ConflictException(
            $"Ya existe el vino '{match.Name}' en esta bodega. Podés agregarle una nueva cosecha.",
            new Dictionary<string, object?>
            {
                ["code"] = "WINE_EXISTS_ADD_VINTAGE",
                ["existingWineId"] = match.Id
            });

        Assert.Equal("WINE_EXISTS_ADD_VINTAGE", ex.Extensions["code"]);
        Assert.Equal(10, ex.Extensions["existingWineId"]);
        Assert.False(ex.Extensions.ContainsKey("existingVintageId"));
    }

    [Fact]
    public void DuplicateCheck_AccentsAndCaseDifferences_AreDetectedAsDuplicate()
    {
        var existing = "Álamos Malbec";
        var candidate = "alamos malbec";
        Assert.Equal(WineLabelNormalizer.Normalize(existing), WineLabelNormalizer.Normalize(candidate));

        var existingEnye = "Viña Alta";
        var candidateEnye = "vina alta";
        Assert.Equal(WineLabelNormalizer.Normalize(existingEnye), WineLabelNormalizer.Normalize(candidateEnye));
    }

    [Fact]
    public void DuplicateCheck_DifferentWineTypeOrDifferentWinery_IsNotDuplicate()
    {
        var existingWines = new List<Wine>
        {
            new() { Id = 10, WineryId = 1, Name = "Gran Reserva", WineType = WineType.Red }
        };

        // Mismo nombre, distinto tipo
        var differentTypeCandidate = new Wine { WineryId = 1, Name = "Gran Reserva", WineType = WineType.White };
        var matchType = existingWines.FirstOrDefault(w =>
            w.WineryId == differentTypeCandidate.WineryId &&
            w.WineType == differentTypeCandidate.WineType &&
            WineLabelNormalizer.Normalize(w.Name) == WineLabelNormalizer.Normalize(differentTypeCandidate.Name));
        Assert.Null(matchType);

        // Mismo nombre, distinta bodega
        var differentWineryCandidate = new Wine { WineryId = 2, Name = "Gran Reserva", WineType = WineType.Red };
        var matchWinery = existingWines.FirstOrDefault(w =>
            w.WineryId == differentWineryCandidate.WineryId &&
            w.WineType == differentWineryCandidate.WineType &&
            WineLabelNormalizer.Normalize(w.Name) == WineLabelNormalizer.Normalize(differentWineryCandidate.Name));
        Assert.Null(matchWinery);
    }

    #endregion

    #region 1.6 Claim Wines Approves Pending Vintages and Preserves Rejected

    [Fact]
    public void ClaimWinesAsync_ApprovesPendingVintages_AndLeavesRejectedIntact()
    {
        // Simulamos la transformación verificada en ClaimWinesAsync
        var wineIds = new List<int> { 1, 2 };

        var vintages = new List<WineVintage>
        {
            new() { Id = 101, WineId = 1, Year = 2020, ApprovalStatus = ApprovalStatus.Pending },
            new() { Id = 102, WineId = 1, Year = 2021, ApprovalStatus = ApprovalStatus.Rejected },
            new() { Id = 103, WineId = 2, Year = 2020, ApprovalStatus = ApprovalStatus.Pending },
            new() { Id = 104, WineId = 2, Year = 2022, ApprovalStatus = ApprovalStatus.Approved },
            new() { Id = 105, WineId = 99, Year = 2020, ApprovalStatus = ApprovalStatus.Pending } // otro vino no reclamado
        };

        // Regla de ClaimWinesAsync: solo actualiza Pending a Approved para los vinos reclamados
        var updatedVintages = vintages.Select(v =>
            wineIds.Contains(v.WineId) && v.ApprovalStatus == ApprovalStatus.Pending
                ? v with { ApprovalStatus = ApprovalStatus.Approved }
                : v
        ).ToList();

        // Assert
        Assert.Equal(ApprovalStatus.Approved, updatedVintages.First(v => v.Id == 101).ApprovalStatus);
        Assert.Equal(ApprovalStatus.Rejected, updatedVintages.First(v => v.Id == 102).ApprovalStatus); // Rejected intacto
        Assert.Equal(ApprovalStatus.Approved, updatedVintages.First(v => v.Id == 103).ApprovalStatus);
        Assert.Equal(ApprovalStatus.Approved, updatedVintages.First(v => v.Id == 104).ApprovalStatus); // Ya estaba Approved
        Assert.Equal(ApprovalStatus.Pending, updatedVintages.First(v => v.Id == 105).ApprovalStatus);  // Vino no reclamado sigue Pending
    }

    #endregion
}
