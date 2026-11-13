using AyVino.Api.Common.Data;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Catalog.DTOs;
using AyVino.Api.Features.Catalog.Repositories;
using AyVino.Api.Features.Catalog.Services;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Cellars.Services;
using AyVino.Api.Features.Grapes.Enums;
using AyVino.Api.Features.Grapes.Models;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Images.Models;
using AyVino.Api.Features.Images.Repositories;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace AyVino.UnitTests;

public class UsuarioBloqueU1Tests
{
    #region 1.1 ToSearchKey Tests

    [Theory]
    [InlineData("Otro Loco Más", "otrolocomas")]
    [InlineData("  Viña   Cobos - Bramare (Malbec)!  ", "vinacobosbramaremalbec")]
    [InlineData("Ñandú Gran Reserva", "nandugranreserva")]
    [InlineData("Árbol, Río... & Sol", "arbolriosol")]
    [InlineData("CAÑÓN DEL ATUEL!", "canondelatuel")]
    [InlineData("Peña Flor", "penaflor")]
    [InlineData("Rutini / Cabernet - Malbec 2020!", "rutinicabernetmalbec2020")]
    public void ToSearchKey_NormalizesAccentsEnyePunctuationAndRemovesSpaces(string input, string expected)
    {
        var result = WineLabelNormalizer.ToSearchKey(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("    ")]
    [InlineData(".,!?---")]
    public void ToSearchKey_NullOrEmptyOrOnlyPunctuation_ReturnsEmptyString(string? input)
    {
        var result = WineLabelNormalizer.ToSearchKey(input);
        Assert.Equal(string.Empty, result);
    }

    [Fact]
    public void ComputeWineKeys_ReturnsCorrectKeys()
    {
        var (nameKey, wineryTextKey) = WineLabelNormalizer.ComputeWineKeys("Otro Loco Más", "Bodega Santa Julia");
        Assert.Equal("otrolocomas", nameKey);
        Assert.Equal("bodegasantajulia", wineryTextKey);
    }

    [Fact]
    public void ComputeWineryKey_ReturnsCorrectKey()
    {
        var key = WineLabelNormalizer.ComputeWineryKey("Catena Zapata");
        Assert.Equal("catenazapata", key);
    }

    #endregion

    #region 1.2 Búsqueda tolerante y ranking: 3 ejemplos de la especificación

    [Fact]
    public void TrigramSimilarity_ThreeExamples_MatchWithExpectedBehavior()
    {
        var targetKey = WineLabelNormalizer.ToSearchKey("Otro Loco Más"); // otrolocomas

        // Ejemplo 1: "otrolocomas" -> exacto
        var key1 = WineLabelNormalizer.ToSearchKey("otrolocomas");
        Assert.Equal(targetKey, key1);

        // Ejemplo 2: "oto loco mas" -> otolocomas (error de tipeo)
        var key2 = WineLabelNormalizer.ToSearchKey("oto loco mas");
        var sim2 = WineLabelNormalizer.TrigramSimilarity(targetKey, key2);
        Assert.True(sim2 > 0.3, $"Similitud esperada > 0.3, obtenida: {sim2}");

        // Ejemplo 3: "otro lo" -> otrolo (prefijo)
        var key3 = WineLabelNormalizer.ToSearchKey("otro lo");
        Assert.StartsWith(key3, targetKey);
    }

    #endregion

    #region 1.4 & 1.5 Catalog Filters & Suggestions Tests

    [Fact]
    public async Task CatalogService_GetFiltersAsync_CachesResultForSubsequentCalls()
    {
        var repo = Substitute.For<ICatalogRepository>();
        var cache = new MemoryCache(new MemoryCacheOptions());

        var filtersData = new CatalogFiltersResponseDto(
            [new CatalogFilterItemDto(1, "Malbec", 10)],
            [new CatalogFilterItemDto(1, "Mendoza", 15)],
            [new CatalogFilterItemDto(1, "Catena Zapata", 5)]
        );

        repo.GetFiltersAsync(Arg.Any<CancellationToken>()).Returns(filtersData);

        var service = new CatalogService(repo, cache);

        var firstCall = await service.GetFiltersAsync();
        var secondCall = await service.GetFiltersAsync();

        Assert.Same(firstCall, secondCall);
        await repo.Received(1).GetFiltersAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CatalogService_GetSuggestionsAsync_Under2Characters_ReturnsEmptyGroups()
    {
        var repo = Substitute.For<ICatalogRepository>();
        var cache = new MemoryCache(new MemoryCacheOptions());
        var service = new CatalogService(repo, cache);

        var result1 = await service.GetSuggestionsAsync("a");
        var result2 = await service.GetSuggestionsAsync(" ");
        var result3 = await service.GetSuggestionsAsync(null);

        Assert.Empty(result1.Wines);
        Assert.Empty(result1.Wineries);
        Assert.Empty(result1.Grapes);
        Assert.Empty(result1.Regions);

        Assert.Empty(result2.Wines);
        Assert.Empty(result3.Wines);
        await repo.DidNotReceive().GetWineSuggestionsAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CatalogService_GetSuggestionsAsync_ReturnsMax3PerGroup_AndFiltersInMemory()
    {
        var repo = Substitute.For<ICatalogRepository>();
        var cache = new MemoryCache(new MemoryCacheOptions());

        repo.GetWineSuggestionsAsync("malbec", Arg.Any<CancellationToken>()).Returns([
            new WineSuggestionDto(1, "Malbec Clásico", "Catena", 2021, null),
            new WineSuggestionDto(2, "Malbec Reserva", "Norton", 2020, null),
            new WineSuggestionDto(3, "Gran Malbec", "Trapiche", 2019, null)
        ]);

        repo.GetWinerySuggestionsAsync("malbec", Arg.Any<CancellationToken>()).Returns([
            new WinerySuggestionDto(1, "Malbec Wines", null, "Mendoza")
        ]);

        var allFilters = new CatalogFiltersResponseDto(
            [
                new CatalogFilterItemDto(1, "Malbec", 50),
                new CatalogFilterItemDto(2, "Malbec Blend", 20),
                new CatalogFilterItemDto(3, "Petit Verdot", 5),
                new CatalogFilterItemDto(4, "Cabernet Franc", 15),
                new CatalogFilterItemDto(5, "Malbec Rose", 8)
            ],
            [
                new CatalogFilterItemDto(1, "Mendoza", 100),
                new CatalogFilterItemDto(2, "San Juan", 20)
            ],
            [
                new CatalogFilterItemDto(1, "Catena", 10)
            ]
        );

        repo.GetFiltersAsync(Arg.Any<CancellationToken>()).Returns(allFilters);

        var service = new CatalogService(repo, cache);

        var result = await service.GetSuggestionsAsync("malbec");

        Assert.Equal(3, result.Wines.Count);
        Assert.Single(result.Wineries);
        // Debería traer máximo 3 uvas ordenadas por relevancia ("Malbec", "Malbec Blend", "Malbec Rose")
        Assert.Equal(3, result.Grapes.Count);
        Assert.Contains(result.Grapes, g => g.Name == "Malbec");
    }

    #endregion

    #region 1.7 Alta Rápida: Validaciones de Uva Principal

    private static IFormFile CreateValidJpegFile()
    {
        var content = new byte[20];
        content[0] = 0xFF;
        content[1] = 0xD8;
        content[2] = 0xFF;
        var file = Substitute.For<IFormFile>();
        file.Length.Returns(content.Length);
        file.FileName.Returns("foto.jpg");
        file.ContentType.Returns("image/jpeg");
        file.OpenReadStream().Returns(_ => new MemoryStream(content));
        return file;
    }

    [Theory]
    [InlineData("Red")]
    [InlineData("White")]
    public async Task QuickAddAsync_RedAndWhite_RequireMainGrapeId(string wineType)
    {
        var cellarRepo = Substitute.For<ICellarRepository>();
        var itemRepo = Substitute.For<ICellarItemRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var wineRepo = Substitute.For<IWineRepository>();
        var grapeRepo = Substitute.For<IGrapeRepository>();

        cellarRepo.GetByIdAsync(10, 1, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = 10, UserId = 1, Name = "Mi Cava" });

        var service = new CellarItemService(cellarRepo, itemRepo, vintageRepo, wineRepo, grapeRepo);

        var req = new QuickAddCellarWineRequestDto(
            Name: "Vino Nuevo",
            WineryName: "Bodega Test",
            WineType: wineType,
            MainGrapeId: null
        );

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.QuickAddAsync(1, 10, req));
        Assert.Equal("La uva principal es obligatoria para vinos tintos y blancos.", ex.Message);
    }

    [Fact]
    public async Task QuickAddAsync_RedWine_RejectsNonRedGrape()
    {
        var cellarRepo = Substitute.For<ICellarRepository>();
        var itemRepo = Substitute.For<ICellarItemRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var wineRepo = Substitute.For<IWineRepository>();
        var grapeRepo = Substitute.For<IGrapeRepository>();

        cellarRepo.GetByIdAsync(10, 1, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = 10, UserId = 1, Name = "Mi Cava" });

        grapeRepo.GetByIdAsync(2, Arg.Any<CancellationToken>())
            .Returns(new Grape { Id = 2, Name = "Chardonnay", ColorType = ColorType.White });

        var service = new CellarItemService(cellarRepo, itemRepo, vintageRepo, wineRepo, grapeRepo);

        var req = new QuickAddCellarWineRequestDto(
            Name: "Tinto Invierno",
            WineryName: "Bodega Test",
            WineType: "Red",
            MainGrapeId: 2
        );

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.QuickAddAsync(1, 10, req));
        Assert.Equal("Los vinos tintos exigen una uva tinta.", ex.Message);
    }

    [Fact]
    public async Task QuickAddAsync_OrangeWine_RejectsRedGrape()
    {
        var cellarRepo = Substitute.For<ICellarRepository>();
        var itemRepo = Substitute.For<ICellarItemRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var wineRepo = Substitute.For<IWineRepository>();
        var grapeRepo = Substitute.For<IGrapeRepository>();

        cellarRepo.GetByIdAsync(10, 1, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = 10, UserId = 1, Name = "Mi Cava" });

        grapeRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(new Grape { Id = 1, Name = "Malbec", ColorType = ColorType.Red });

        var service = new CellarItemService(cellarRepo, itemRepo, vintageRepo, wineRepo, grapeRepo);

        var req = new QuickAddCellarWineRequestDto(
            Name: "Naranjo Criollo",
            WineryName: "Bodega Test",
            WineType: "Orange",
            MainGrapeId: 1
        );

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.QuickAddAsync(1, 10, req));
        Assert.Equal("Los vinos naranjos solo aceptan uvas blancas o de piel rosada.", ex.Message);
    }

    [Fact]
    public async Task QuickAddAsync_NonExistingGrape_ThrowsValidationException()
    {
        var cellarRepo = Substitute.For<ICellarRepository>();
        var itemRepo = Substitute.For<ICellarItemRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var wineRepo = Substitute.For<IWineRepository>();
        var grapeRepo = Substitute.For<IGrapeRepository>();

        cellarRepo.GetByIdAsync(10, 1, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = 10, UserId = 1, Name = "Mi Cava" });

        grapeRepo.GetByIdAsync(999, Arg.Any<CancellationToken>())
            .Returns((Grape?)null);

        var service = new CellarItemService(cellarRepo, itemRepo, vintageRepo, wineRepo, grapeRepo);

        var req = new QuickAddCellarWineRequestDto(
            Name: "Blanco Dulce",
            WineryName: "Bodega Test",
            WineType: "White",
            MainGrapeId: 999
        );

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.QuickAddAsync(1, 10, req));
        Assert.Contains("999 no existe", ex.Message);
    }

    [Fact]
    public async Task QuickAddAsync_ValidRed_Stores100PercentGrape_AndPendingVintage()
    {
        var cellarRepo = Substitute.For<ICellarRepository>();
        var itemRepo = Substitute.For<ICellarItemRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var wineRepo = Substitute.For<IWineRepository>();
        var grapeRepo = Substitute.For<IGrapeRepository>();

        cellarRepo.GetByIdAsync(10, 1, Arg.Any<CancellationToken>())
            .Returns(new Cellar { Id = 10, UserId = 1, Name = "Mi Cava" });

        grapeRepo.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(new Grape { Id = 1, Name = "Malbec", ColorType = ColorType.Red });

        var createdWine = new Wine { Id = 55, Name = "Malbec Roble", SourceType = SourceType.Community };
        List<WineGrape>? capturedGrapes = null;
        WineVintage? capturedVintage = null;

        wineRepo.CreateWithFirstVintageAsync(
            Arg.Any<Wine>(),
            Arg.Do<WineVintage>(v => capturedVintage = v),
            Arg.Do<IEnumerable<WineGrape>>(g => capturedGrapes = g.ToList()),
            Arg.Any<CancellationToken>())
            .Returns(createdWine);

        vintageRepo.GetAllByWineIdAsync(55, Arg.Any<CancellationToken>())
            .Returns([new WineVintage { Id = 88, WineId = 55, ApprovalStatus = ApprovalStatus.Pending, Year = 2022 }]);

        itemRepo.GetRowAsync(10, 88, Arg.Any<CancellationToken>())
            .Returns(new CellarItemListRow
            {
                WineId = 55,
                WineVintageId = 88,
                Name = "Malbec Roble",
                WineType = WineType.Red,
                Quantity = 1,
                LastChangeAt = DateTime.UtcNow
            });

        var service = new CellarItemService(cellarRepo, itemRepo, vintageRepo, wineRepo, grapeRepo);

        var req = new QuickAddCellarWineRequestDto(
            Name: "Malbec Roble",
            WineryName: "Bodega Test",
            WineType: "Red",
            Year: 2022,
            MainGrapeId: 1
        );

        var result = await service.QuickAddAsync(1, 10, req);

        Assert.NotNull(result);
        Assert.Equal(55, result.WineId);
        Assert.Equal(88, result.WineVintageId);
        Assert.NotNull(capturedGrapes);
        var grapeEntry = Assert.Single(capturedGrapes);
        Assert.Equal(1, grapeEntry.GrapeId);
        Assert.Equal(100, grapeEntry.Percentage);
        Assert.NotNull(capturedVintage);
        Assert.Equal(ApprovalStatus.Pending, capturedVintage.ApprovalStatus);
    }

    #endregion

    #region 1.8 Permisos de imagen en cosecha comunitaria

    [Fact]
    public async Task UploadVintageImage_CommunityWineCreator_AllowedToUpload()
    {
        var imageRepo = Substitute.For<IImageRepository>();
        var imageStorage = Substitute.For<IImageStorage>();
        var userRepo = Substitute.For<IUserRepository>();
        var wineryRepo = Substitute.For<IWineryRepository>();
        var wineRepo = Substitute.For<IWineRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var txRunner = Substitute.For<IImageTransactionRunner>();
        var logger = Substitute.For<ILogger<ImageOrchestrator>>();

        var communityWine = new Wine
        {
            Id = 10,
            Name = "Comunitario",
            WineryId = null,
            SourceType = SourceType.Community
        };

        var vintage = new WineVintage
        {
            Id = 20,
            WineId = 10,
            ApprovalStatus = ApprovalStatus.Approved, // Ya aprobada pero sigue siendo comunitaria
            UploadedByUserId = 42
        };

        wineRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(communityWine);
        vintageRepo.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);

        imageStorage.UploadAsync(Arg.Any<Guid>(), Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<ImageType>(), Arg.Any<CancellationToken>())
            .Returns(new StoredImageResult("ext123", 800, 600, 1024));

        var orchestrator = new ImageOrchestrator(
            txRunner, imageStorage, imageRepo, userRepo, wineryRepo, wineRepo, vintageRepo, logger);

        var file = CreateValidJpegFile();

        var actor = new Actor(42, "User");

        var result = await orchestrator.UploadVintageImageAsync(10, 20, file, actor);

        Assert.NotEqual(Guid.Empty, result);
        await txRunner.Received(1).AttachVintageImageAsync(Arg.Any<Image>(), 20, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UploadVintageImage_CommunityWineDifferentUser_ThrowsForbidden()
    {
        var imageRepo = Substitute.For<IImageRepository>();
        var imageStorage = Substitute.For<IImageStorage>();
        var userRepo = Substitute.For<IUserRepository>();
        var wineryRepo = Substitute.For<IWineryRepository>();
        var wineRepo = Substitute.For<IWineRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var txRunner = Substitute.For<IImageTransactionRunner>();
        var logger = Substitute.For<ILogger<ImageOrchestrator>>();

        var communityWine = new Wine
        {
            Id = 10,
            Name = "Comunitario",
            WineryId = null,
            SourceType = SourceType.Community
        };

        var vintage = new WineVintage
        {
            Id = 20,
            WineId = 10,
            ApprovalStatus = ApprovalStatus.Approved,
            UploadedByUserId = 42 // Subido por user 42
        };

        wineRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(communityWine);
        vintageRepo.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(vintage);

        var orchestrator = new ImageOrchestrator(
            txRunner, imageStorage, imageRepo, userRepo, wineryRepo, wineRepo, vintageRepo, logger);

        var file = CreateValidJpegFile();

        var differentActor = new Actor(99, "User");

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            orchestrator.UploadVintageImageAsync(10, 20, file, differentActor));
    }

    #endregion
}
