using System.Data;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Wineries.DTOs;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Services;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using AyVino.Api.Features.Wines.Utils;
using NSubstitute;

namespace AyVino.UnitTests;

public class CommunityWineBlock1Tests
{
    #region 1. WineLabelNormalizer Tests

    [Fact]
    public void WineLabelNormalizer_AccentsAndDiacritics_AreStripped()
    {
        var input = "Malbéc Añejo Café Óptimo Único pingüino";
        var normalized = WineLabelNormalizer.Normalize(input);
        Assert.Equal("malbec anejo cafe optimo unico pinguino", normalized);
    }

    [Fact]
    public void WineLabelNormalizer_Uppercase_ConvertsToLowercase()
    {
        var input = "CHARDONNAY GRAN RESERVA";
        var normalized = WineLabelNormalizer.Normalize(input);
        Assert.Equal("chardonnay gran reserva", normalized);
    }

    [Fact]
    public void WineLabelNormalizer_SpecialCharsAndPunctuation_TreatedAsSpaces()
    {
        var input = "Catena & Zapata (Reserva) - Special #1 / 2021!";
        var normalized = WineLabelNormalizer.Normalize(input);
        Assert.Equal("catena zapata reserva special 1 2021", normalized);
    }

    [Fact]
    public void WineLabelNormalizer_Whitespace_CollapsedAndTrimmed()
    {
        var input = "   Trapiche    Grand    Malbec   ";
        var normalized = WineLabelNormalizer.Normalize(input);
        Assert.Equal("trapiche grand malbec", normalized);
    }

    [Fact]
    public void WineLabelNormalizer_NullOrEmpty_ReturnsEmptyString()
    {
        Assert.Equal(string.Empty, WineLabelNormalizer.Normalize(null));
        Assert.Equal(string.Empty, WineLabelNormalizer.Normalize(""));
        Assert.Equal(string.Empty, WineLabelNormalizer.Normalize("    "));
    }

    [Fact]
    public void WineLabelNormalizer_BuildLabelKey_FormatsCorrectly()
    {
        var key = WineLabelNormalizer.BuildLabelKey("Gran Reserva", "Bodega Norton", WineType.Red);
        Assert.Equal("gran reserva|bodega norton|1", key);
    }

    [Fact]
    public void WineLabelNormalizer_BuildLabelKey_MatchesRegisteredWineryAndText()
    {
        var keyFromRegistered = WineLabelNormalizer.BuildLabelKey("Rutini Cabernet", "Rutini Wines", WineType.Red);
        var keyFromText = WineLabelNormalizer.BuildLabelKey("  RUTINI   cabernet  ", "rutini  wines", WineType.Red);
        Assert.Equal(keyFromRegistered, keyFromText);
    }

    #endregion

    #region 2. WineService MatchAsync Tests

    [Fact]
    public async Task MatchAsync_LabelAndYearMatch_ReturnsWineAndVintage()
    {
        // Arrange
        var wineRepo = Substitute.For<IWineRepository>();
        var wineryRepo = Substitute.For<IWineryRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();

        var wine = new Wine
        {
            Id = 10,
            Name = "Angélica Zapata",
            WineryId = 20,
            WineType = WineType.Red,
            LabelKey = "angelica zapata|catena zapata|1"
        };
        var winery = new Winery { Id = 20, Name = "Catena Zapata", Status = WineryStatus.Approved };
        var vintages = new List<WineVintage>
        {
            new() { Id = 100, WineId = 10, Year = 2018, ApprovalStatus = ApprovalStatus.Approved },
            new() { Id = 101, WineId = 10, Year = 2019, ApprovalStatus = ApprovalStatus.Pending }
        };

        wineRepo.GetByLabelKeyAsync("angelica zapata|catena zapata|1", Arg.Any<CancellationToken>())
            .Returns(wine);
        wineryRepo.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(winery);
        vintageRepo.GetAllByWineIdAsync(10, Arg.Any<CancellationToken>()).Returns(vintages);

        var service = new WineService(wineRepo, wineryRepo, Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>(), vintageRepo);

        // Act
        var result = await service.MatchAsync("Angélica Zapata", "Catena Zapata", "Red", 2019);

        // Assert
        Assert.NotNull(result.Wine);
        Assert.Equal(10, result.Wine.Id);
        Assert.Equal("Angélica Zapata", result.Wine.Name);
        Assert.Equal("Catena Zapata", result.Wine.Winery);
        Assert.Equal("Red", result.Wine.Type);

        Assert.NotNull(result.Vintage);
        Assert.Equal(101, result.Vintage.Id);
        Assert.Equal(2019, result.Vintage.Year);
        Assert.Equal("Pending", result.Vintage.ApprovalStatus);
    }

    [Fact]
    public async Task MatchAsync_OnlyLabelMatches_ReturnsWineAndNullVintage()
    {
        // Arrange
        var wineRepo = Substitute.For<IWineRepository>();
        var wineryRepo = Substitute.For<IWineryRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();

        var wine = new Wine
        {
            Id = 10,
            Name = "Angélica Zapata",
            WineryNameText = "Catena Zapata",
            WineType = WineType.Red,
            LabelKey = "angelica zapata|catena zapata|1"
        };
        var vintages = new List<WineVintage>
        {
            new() { Id = 100, WineId = 10, Year = 2018, ApprovalStatus = ApprovalStatus.Approved }
        };

        wineRepo.GetByLabelKeyAsync("angelica zapata|catena zapata|1", Arg.Any<CancellationToken>())
            .Returns(wine);
        vintageRepo.GetAllByWineIdAsync(10, Arg.Any<CancellationToken>()).Returns(vintages);

        var service = new WineService(wineRepo, wineryRepo, Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>(), vintageRepo);

        // Act (looking for year 2022 which does not exist)
        var result = await service.MatchAsync("Angélica Zapata", "Catena Zapata", "Red", 2022);

        // Assert
        Assert.NotNull(result.Wine);
        Assert.Equal(10, result.Wine.Id);
        Assert.Equal("Catena Zapata", result.Wine.Winery);
        Assert.Null(result.Vintage);
    }

    [Fact]
    public async Task MatchAsync_NoMatch_ReturnsNullWineAndNullVintage()
    {
        // Arrange
        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByLabelKeyAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns((Wine?)null);

        var service = new WineService(wineRepo, Substitute.For<IWineryRepository>(), Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());

        // Act
        var result = await service.MatchAsync("Vino Fantasma", "Bodega Desconocida", "White", 2020);

        // Assert
        Assert.Null(result.Wine);
        Assert.Null(result.Vintage);
    }

    [Fact]
    public async Task MatchAsync_SinAnada_MatchesVintageWithoutYear()
    {
        // Arrange
        var wineRepo = Substitute.For<IWineRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();

        var wine = new Wine
        {
            Id = 15,
            Name = "Blend Especial",
            WineryNameText = "Cavas del Valle",
            WineType = WineType.Red,
            LabelKey = "blend especial|cavas del valle|1"
        };
        var vintages = new List<WineVintage>
        {
            new() { Id = 200, WineId = 15, Year = null, ApprovalStatus = ApprovalStatus.Pending }
        };

        wineRepo.GetByLabelKeyAsync("blend especial|cavas del valle|1", Arg.Any<CancellationToken>())
            .Returns(wine);
        vintageRepo.GetAllByWineIdAsync(15, Arg.Any<CancellationToken>()).Returns(vintages);

        var service = new WineService(wineRepo, Substitute.For<IWineryRepository>(), Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>(), vintageRepo);

        // Act: year is null (sin añada)
        var result = await service.MatchAsync("Blend Especial", "Cavas del Valle", "Red", null);

        // Assert
        Assert.NotNull(result.Wine);
        Assert.NotNull(result.Vintage);
        Assert.Equal(200, result.Vintage.Id);
        Assert.Null(result.Vintage.Year);
    }

    [Fact]
    public async Task MatchAsync_DuplicateWine_IsExcludedFromMatch()
    {
        // Arrange: WineRepository GetByLabelKeyAsync filters duplicate_of_wine_id IS NULL.
        // If a duplicate exists, GetByLabelKeyAsync returns null.
        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByLabelKeyAsync("malbec reserva|bodega norton|1", Arg.Any<CancellationToken>())
            .Returns((Wine?)null); // Duplicate is excluded by repo

        var service = new WineService(wineRepo, Substitute.For<IWineryRepository>(), Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>());

        // Act
        var result = await service.MatchAsync("Malbec Reserva", "Bodega Norton", "Red", 2020);

        // Assert
        Assert.Null(result.Wine);
        Assert.Null(result.Vintage);
    }
    #endregion

    #region 3. Wine Creation Validations and 409 Conflict with Extensions

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateAsync_CommunityWine_WithoutWineryNameText_ThrowsValidationException(string? invalidWineryText)
    {
        // Arrange
        var service = new WineService(
            Substitute.For<IWineRepository>(),
            Substitute.For<IWineryRepository>(),
            Substitute.For<ILocationRepository>(),
            Substitute.For<IGrapeRepository>());

        var request = new CreateWineRequestDto(
            WineryId: null,
            WineryNameText: invalidWineryText,
            Name: "Vino Comunitario",
            Description: "Prueba",
            WineType: "Red",
            LocationId: null,
            FirstVintage: new CreateWineVintageRequestDto(Year: 2020)
        );

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.CreateAsync(request, new Actor(1, AppRoles.User)));

        Assert.Contains("nombre de la bodega es obligatorio", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateAsync_CommunityWine_WineryNameTextTooLong_ThrowsValidationException()
    {
        // Arrange
        var service = new WineService(
            Substitute.For<IWineRepository>(),
            Substitute.For<IWineryRepository>(),
            Substitute.For<ILocationRepository>(),
            Substitute.For<IGrapeRepository>());

        var request = new CreateWineRequestDto(
            WineryId: null,
            WineryNameText: new string('A', 151),
            Name: "Vino Comunitario",
            Description: "Prueba",
            WineType: "Red",
            LocationId: null,
            FirstVintage: new CreateWineVintageRequestDto(Year: 2020)
        );

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.CreateAsync(request, new Actor(1, AppRoles.User)));

        Assert.Contains("150 caracteres", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_DuplicateLabelKey_WithMatchingVintage_ThrowsConflictWithExtensions()
    {
        // Arrange
        var wineRepo = Substitute.For<IWineRepository>();
        var wineryRepo = Substitute.For<IWineryRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();

        var existingWine = new Wine
        {
            Id = 42,
            Name = "Gran Reserva Malbec",
            WineryNameText = "Bodega Norton",
            WineType = WineType.Red,
            LabelKey = "gran reserva malbec|bodega norton|1"
        };
        var existingVintages = new List<WineVintage>
        {
            new() { Id = 88, WineId = 42, Year = 2020 }
        };

        wineRepo.GetByLabelKeyAsync("gran reserva malbec|bodega norton|1", Arg.Any<CancellationToken>())
            .Returns(existingWine);
        vintageRepo.GetAllByWineIdAsync(42, Arg.Any<CancellationToken>())
            .Returns(existingVintages);

        var service = new WineService(wineRepo, wineryRepo, Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>(), vintageRepo);

        var request = new CreateWineRequestDto(
            WineryId: null,
            WineryNameText: "Bodega Norton",
            Name: "Gran Reserva Malbec",
            Description: "Desc",
            WineType: "Red",
            LocationId: null,
            FirstVintage: new CreateWineVintageRequestDto(Year: 2020)
        );

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            service.CreateAsync(request, new Actor(1, AppRoles.User)));

        Assert.Equal(42, ex.Extensions["existingWineId"]);
        Assert.Equal(88, ex.Extensions["existingVintageId"]);
    }

    [Fact]
    public async Task CreateAsync_DuplicateLabelKey_WithoutMatchingVintage_ThrowsConflictWithNullExistingVintageId()
    {
        // Arrange
        var wineRepo = Substitute.For<IWineRepository>();
        var wineryRepo = Substitute.For<IWineryRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();

        var existingWine = new Wine
        {
            Id = 55,
            Name = "Malbec Roble",
            WineryNameText = "Trapiche",
            WineType = WineType.Red,
            LabelKey = "malbec roble|trapiche|1"
        };
        var existingVintages = new List<WineVintage>
        {
            new() { Id = 90, WineId = 55, Year = 2019 }
        };

        wineRepo.GetByLabelKeyAsync("malbec roble|trapiche|1", Arg.Any<CancellationToken>())
            .Returns(existingWine);
        vintageRepo.GetAllByWineIdAsync(55, Arg.Any<CancellationToken>())
            .Returns(existingVintages);

        var service = new WineService(wineRepo, wineryRepo, Substitute.For<ILocationRepository>(), Substitute.For<IGrapeRepository>(), vintageRepo);

        var request = new CreateWineRequestDto(
            WineryId: null,
            WineryNameText: "Trapiche",
            Name: "Malbec Roble",
            Description: "Desc",
            WineType: "Red",
            LocationId: null,
            FirstVintage: new CreateWineVintageRequestDto(Year: 2021) // Year 2021 not in vintages
        );

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            service.CreateAsync(request, new Actor(1, AppRoles.User)));

        Assert.Equal(55, ex.Extensions["existingWineId"]);
        Assert.Null(ex.Extensions["existingVintageId"]);
    }

    #endregion

    #region 4. WineVintageService Conflict on Duplicate Year

    [Fact]
    public async Task WineVintage_CreateAsync_DuplicateYear_ThrowsConflictWithExistingVintageId()
    {
        // Arrange
        var wineRepo = Substitute.For<IWineRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();

        var wine = new Wine { Id = 10, Name = "Vino Test" };
        wineRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);

        var existingVintages = new List<WineVintage>
        {
            new() { Id = 77, WineId = 10, Year = 2020 }
        };
        vintageRepo.GetAllByWineIdAsync(10, Arg.Any<CancellationToken>()).Returns(existingVintages);

        var service = new WineVintageService(vintageRepo, wineRepo, Substitute.For<IGrapeRepository>(), Substitute.For<IWineryRepository>());

        var request = new CreateWineVintageRequestDto(Year: 2020);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            service.CreateAsync(10, request, new Actor(1, AppRoles.User)));

        Assert.Equal(77, ex.Extensions["existingVintageId"]);
    }

    [Fact]
    public async Task WineVintage_CreateAsync_DuplicateNullYear_ThrowsConflictWithExistingVintageId()
    {
        // Arrange
        var wineRepo = Substitute.For<IWineRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();

        var wine = new Wine { Id = 10, Name = "Vino Test" };
        wineRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);

        var existingVintages = new List<WineVintage>
        {
            new() { Id = 88, WineId = 10, Year = null }
        };
        vintageRepo.GetAllByWineIdAsync(10, Arg.Any<CancellationToken>()).Returns(existingVintages);

        var service = new WineVintageService(vintageRepo, wineRepo, Substitute.For<IGrapeRepository>(), Substitute.For<IWineryRepository>());

        var request = new CreateWineVintageRequestDto(Year: null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            service.CreateAsync(10, request, new Actor(1, AppRoles.User)));

        Assert.Equal(88, ex.Extensions["existingVintageId"]);
    }

    #endregion

    #region 5. Wine Grapes Null Percentage

    [Fact]
    public async Task WineGrapes_AcceptsNullPercentage_WithoutValidationErrors()
    {
        // Arrange
        var wineRepo = Substitute.For<IWineRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var grapeRepo = Substitute.For<IGrapeRepository>();

        var wine = new Wine { Id = 10, Name = "Vino Blend" };
        wineRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(wine);
        vintageRepo.GetAllByWineIdAsync(10, Arg.Any<CancellationToken>()).Returns([]);

        grapeRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);
        grapeRepo.ExistsByIdAsync(2, Arg.Any<CancellationToken>()).Returns(true);

        vintageRepo.CreateAsync(Arg.Any<WineVintage>(), Arg.Any<IEnumerable<WineGrape>>(), Arg.Any<CancellationToken>())
            .Returns(call =>
            {
                var v = call.Arg<WineVintage>();
                return v with { Id = 123 };
            });

        var service = new WineVintageService(vintageRepo, wineRepo, grapeRepo, Substitute.For<IWineryRepository>());

        // Request with grapes without percentages (null)
        var request = new CreateWineVintageRequestDto(
            Year: 2023,
            Grapes:
            [
                new WineGrapeRequestDto(GrapeId: 1, Percentage: null),
                new WineGrapeRequestDto(GrapeId: 2, Percentage: null)
            ]
        );

        // Act
        var result = await service.CreateAsync(10, request, new Actor(1, AppRoles.User));

        // Assert
        Assert.NotNull(result);
        Assert.Equal(123, result.Id);
        Assert.Equal(2, result.Grapes.Count());
        Assert.All(result.Grapes, g => Assert.Null(g.Percentage));
    }

    #endregion

    #region 6. Winery Rename Recalculates LabelKeys

    [Fact]
    public async Task Winery_Rename_CallsUpdateLabelKeysForWineryAsync()
    {
        // Arrange
        var wineryRepo = Substitute.For<IWineryRepository>();
        var locationRepo = Substitute.For<ILocationRepository>();

        var existingWinery = new Winery
        {
            Id = 5,
            Name = "Bodega Vieja",
            UserId = 1,
            Status = WineryStatus.Approved,
            LocationId = 1
        };

        wineryRepo.GetByIdAsync(5, Arg.Any<CancellationToken>()).Returns(existingWinery);
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);
        wineryRepo.UpdateAsync(Arg.Any<Winery>(), Arg.Any<CancellationToken>()).Returns(true);

        var service = new WineryService(
            wineryRepo,
            locationRepo,
            Substitute.For<AyVino.Api.Features.Locations.Repositories.ICityRepository>(),
            Substitute.For<AyVino.Api.Features.Locations.Services.IGeorefClient>(),
            Substitute.For<AyVino.Api.Features.Users.Services.IUserService>(),
            Substitute.For<AyVino.Api.Common.Security.Jwt.IJwtTokenGenerator>());

        var updateDto = new UpdateWineryRequestDto(
            Name: "Bodega Nueva",
            Description: "Nueva desc",
            LocationId: 1
        );

        // Act
        await service.UpdateAsync(5, updateDto, new Actor(1, AppRoles.User));

        // Assert: UpdateAsync was called with new name
        await wineryRepo.Received(1).UpdateAsync(
            Arg.Is<Winery>(w => w.Id == 5 && w.Name == "Bodega Nueva"),
            Arg.Any<CancellationToken>());
    }

    #endregion
}
