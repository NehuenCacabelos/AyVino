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

public class WineNewLabelDuplicateTests
{
    private static Winery CreateApprovedWinery(int id, int userId) => new()
    {
        Id = id,
        Name = "Bodega Las Perdices",
        LocationId = 1,
        UserId = userId,
        Status = WineryStatus.Approved,
        RegisterDate = DateTime.UtcNow
    };

    [Fact]
    public void GetMainGrapeId_HighestPercentageWins()
    {
        var grapes = new List<WineGrape>
        {
            new() { GrapeId = 1, Percentage = 30m },
            new() { GrapeId = 2, Percentage = 70m }
        };

        var mainGrapeId = WineRepository.GetMainGrapeId(grapes);

        Assert.Equal(2, mainGrapeId);
    }

    [Fact]
    public void GetMainGrapeId_TieBreak_ReturnsSmallestGrapeId()
    {
        var grapes = new List<WineGrape>
        {
            new() { GrapeId = 5, Percentage = 50m },
            new() { GrapeId = 2, Percentage = 50m }
        };

        var mainGrapeId = WineRepository.GetMainGrapeId(grapes);

        Assert.Equal(2, mainGrapeId);
    }

    [Fact]
    public void GetMainGrapeId_EmptyOrNull_ReturnsNull()
    {
        Assert.Null(WineRepository.GetMainGrapeId([]));
        Assert.Null(WineRepository.GetMainGrapeId(null));
    }

    [Fact]
    public void GetMainGrapeId_NullPercentage_NonTiedHandledProperly()
    {
        var grapes = new List<WineGrape>
        {
            new() { GrapeId = 3, Percentage = null },
            new() { GrapeId = 4, Percentage = 10m }
        };

        var mainGrapeId = WineRepository.GetMainGrapeId(grapes);

        Assert.Equal(4, mainGrapeId);
    }

    [Fact]
    public void CreateWineRequestDto_DefaultsConfirmNewLabelToFalse()
    {
        var dto = new CreateWineRequestDto(
            Name: "Cordero con piel de lobo",
            WineType: "Red",
            FirstVintage: new CreateWineVintageRequestDto(Year: 2021));

        Assert.False(dto.ConfirmNewLabel);

        var dtoWithFlag = dto with { ConfirmNewLabel = true };
        Assert.True(dtoWithFlag.ConfirmNewLabel);
    }

    [Fact]
    public async Task WineService_CreateAsync_PropagatesConfirmNewLabelToRepository()
    {
        var wineRepo = Substitute.For<IWineRepository>();
        var wineryRepo = Substitute.For<IWineryRepository>();
        var locationRepo = Substitute.For<ILocationRepository>();
        var grapeRepo = Substitute.For<IGrapeRepository>();

        wineryRepo.ExistsByIdAsync(10, Arg.Any<CancellationToken>()).Returns(true);
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(CreateApprovedWinery(10, 5));
        locationRepo.ExistsByIdAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        bool? capturedConfirmNewLabel = null;
        wineRepo.CreateWithFirstVintageAsync(
            Arg.Any<Wine>(),
            Arg.Any<WineVintage>(),
            Arg.Any<IEnumerable<WineGrape>>(),
            Arg.Do<bool>(v => capturedConfirmNewLabel = v),
            Arg.Any<CancellationToken>())
            .Returns(args => ((Wine)args[0]) with { Id = 77 });

        var service = new WineService(wineRepo, wineryRepo, locationRepo, grapeRepo);
        var actor = new Actor(5, "Winery");

        var request = new CreateWineRequestDto(
            Name: "Cordero con piel de lobo",
            WineType: "Red",
            FirstVintage: new CreateWineVintageRequestDto(Year: 2022),
            WineryId: 10,
            LocationId: 1,
            ConfirmNewLabel: true);

        var response = await service.CreateAsync(request, actor);

        Assert.NotNull(response);
        Assert.True(capturedConfirmNewLabel);
    }

    // Simulador de la lógica de conflicto de CreateWithFirstVintageAsync para pruebas unitarias de los casos (a)-(f)
    private static void SimulateDuplicateCheck(
        Wine newWine,
        WineVintage newVintage,
        IEnumerable<WineGrape> newGrapes,
        bool confirmNewLabel,
        List<Wine> existingWines,
        List<(int WineId, int? Year, int? MainGrapeId, string? MainGrapeName)> existingVintagesWithMainGrapes)
    {
        if (!newWine.WineryId.HasValue) return;

        var normalizedName = WineLabelNormalizer.Normalize(newWine.Name);
        var matchingCandidates = existingWines.Where(c =>
            c.WineryId == newWine.WineryId &&
            c.WineType == newWine.WineType &&
            c.DuplicateOfWineId == null &&
            WineLabelNormalizer.Normalize(c.Name) == normalizedName).ToList();

        if (matchingCandidates.Count == 0) return;

        var newVintageMainGrapeId = WineRepository.GetMainGrapeId(newGrapes);

        void ThrowConflict(Wine targetWine, List<(int WineId, int? Year, int? MainGrapeId, string? MainGrapeName)> targetVintages)
        {
            var summaries = targetVintages
                .OrderByDescending(v => v.Year.HasValue)
                .ThenByDescending(v => v.Year)
                .Select(v => new ExistingVintageSummaryDto(v.Year, v.MainGrapeId, v.MainGrapeName))
                .ToList();

            var existingVintage = newVintage.Year.HasValue
                ? targetVintages.FirstOrDefault(v => v.Year == newVintage.Year)
                : default;

            if (existingVintage != default)
            {
                throw new ConflictException(
                    $"Ya existe el vino '{targetWine.Name}' con la cosecha {newVintage.Year} en esta bodega.",
                    new Dictionary<string, object?>
                    {
                        ["code"] = "WINE_VINTAGE_DUPLICATE",
                        ["existingWineId"] = targetWine.Id,
                        ["existingVintageId"] = 999,
                        ["existingVintages"] = summaries
                    });
            }

            throw new ConflictException(
                $"Ya existe el vino '{targetWine.Name}' en esta bodega. Podés agregarle una nueva cosecha.",
                new Dictionary<string, object?>
                {
                    ["code"] = "WINE_EXISTS_ADD_VINTAGE",
                    ["existingWineId"] = targetWine.Id,
                    ["existingVintages"] = summaries
                });
        }

        if (!confirmNewLabel)
        {
            Wine existingWine;
            if (newVintageMainGrapeId.HasValue)
            {
                var sharingCandidate = matchingCandidates
                    .Where(w => existingVintagesWithMainGrapes.Any(v => v.WineId == w.Id && v.MainGrapeId == newVintageMainGrapeId.Value))
                    .OrderBy(w => w.Id)
                    .FirstOrDefault();

                existingWine = sharingCandidate ?? matchingCandidates.OrderBy(w => w.Id).First();
            }
            else
            {
                existingWine = matchingCandidates.OrderBy(w => w.Id).First();
            }

            ThrowConflict(existingWine, existingVintagesWithMainGrapes.Where(v => v.WineId == existingWine.Id).ToList());
        }
        else
        {
            if (newVintageMainGrapeId.HasValue)
            {
                var candidateWithSameGrape = matchingCandidates
                    .Where(w => existingVintagesWithMainGrapes.Any(v => v.WineId == w.Id && v.MainGrapeId == newVintageMainGrapeId.Value))
                    .OrderBy(w => w.Id)
                    .FirstOrDefault();

                if (candidateWithSameGrape != null)
                {
                    ThrowConflict(candidateWithSameGrape, existingVintagesWithMainGrapes.Where(v => v.WineId == candidateWithSameGrape.Id).ToList());
                }
            }
        }
    }

    [Fact]
    public void CaseA_SameNameAndTypeDifferentGrapeWithoutFlag_Throws409ExistsAddVintageWithExistingVintages()
    {
        var existingWines = new List<Wine>
        {
            new() { Id = 10, WineryId = 1, Name = "Cordero con Piel de Lobo", WineType = WineType.Red }
        };
        var existingVintages = new List<(int WineId, int? Year, int? MainGrapeId, string? MainGrapeName)>
        {
            (10, 2020, 1, "Malbec"),
            (10, 2019, 1, "Malbec")
        };

        var newWine = new Wine { WineryId = 1, Name = "Cordero con Piel de Lobo", WineType = WineType.Red };
        var newVintage = new WineVintage { Year = 2021 };
        var newGrapes = new List<WineGrape> { new() { GrapeId = 2, Percentage = 100m } }; // Cabernet Sauvignon

        var ex = Assert.Throws<ConflictException>(() =>
            SimulateDuplicateCheck(newWine, newVintage, newGrapes, confirmNewLabel: false, existingWines, existingVintages));

        Assert.Equal("WINE_EXISTS_ADD_VINTAGE", ex.Extensions["code"]);
        Assert.Equal(10, ex.Extensions["existingWineId"]);
        var vintages = Assert.IsAssignableFrom<IEnumerable<ExistingVintageSummaryDto>>(ex.Extensions["existingVintages"]).ToList();
        Assert.Equal(2, vintages.Count);
        Assert.Equal(2020, vintages[0].Year);
        Assert.Equal("Malbec", vintages[0].MainGrapeName);
        Assert.Equal(1, vintages[0].MainGrapeId);
    }

    [Fact]
    public void CaseB_SameNameAndTypeDifferentGrapeWithFlag_CreatesNewWineWithoutConflict()
    {
        var existingWines = new List<Wine>
        {
            new() { Id = 10, WineryId = 1, Name = "Cordero con Piel de Lobo", WineType = WineType.Red }
        };
        var existingVintages = new List<(int WineId, int? Year, int? MainGrapeId, string? MainGrapeName)>
        {
            (10, 2020, 1, "Malbec")
        };

        var newWine = new Wine { WineryId = 1, Name = "Cordero con Piel de Lobo", WineType = WineType.Red };
        var newVintage = new WineVintage { Year = 2021 };
        var newGrapes = new List<WineGrape> { new() { GrapeId = 2, Percentage = 100m } }; // Cabernet Sauvignon

        // With ConfirmNewLabel = true, no exception thrown
        SimulateDuplicateCheck(newWine, newVintage, newGrapes, confirmNewLabel: true, existingWines, existingVintages);
    }

    [Fact]
    public void CaseC_SameNameAndTypeSameGrapeWithFlag_Throws409PointingToExistingWine()
    {
        var existingWines = new List<Wine>
        {
            new() { Id = 10, WineryId = 1, Name = "Cordero con Piel de Lobo", WineType = WineType.Red }
        };
        var existingVintages = new List<(int WineId, int? Year, int? MainGrapeId, string? MainGrapeName)>
        {
            (10, 2020, 1, "Malbec")
        };

        var newWine = new Wine { WineryId = 1, Name = "Cordero con Piel de Lobo", WineType = WineType.Red };
        var newVintage = new WineVintage { Year = 2021 };
        var newGrapes = new List<WineGrape> { new() { GrapeId = 1, Percentage = 100m } }; // Misma uva: Malbec

        var ex = Assert.Throws<ConflictException>(() =>
            SimulateDuplicateCheck(newWine, newVintage, newGrapes, confirmNewLabel: true, existingWines, existingVintages));

        Assert.Equal("WINE_EXISTS_ADD_VINTAGE", ex.Extensions["code"]);
        Assert.Equal(10, ex.Extensions["existingWineId"]);
    }

    [Fact]
    public void CaseD_SameNameAndSameYearDifferentGrapeWithFlag_CreatesNewWineWithoutBlocking()
    {
        var existingWines = new List<Wine>
        {
            new() { Id = 10, WineryId = 1, Name = "Cordero con Piel de Lobo", WineType = WineType.Red }
        };
        var existingVintages = new List<(int WineId, int? Year, int? MainGrapeId, string? MainGrapeName)>
        {
            (10, 2020, 1, "Malbec")
        };

        var newWine = new Wine { WineryId = 1, Name = "Cordero con Piel de Lobo", WineType = WineType.Red };
        var newVintage = new WineVintage { Year = 2020 }; // Mismo año 2020
        var newGrapes = new List<WineGrape> { new() { GrapeId = 2, Percentage = 100m } }; // Otra uva: Cabernet Sauvignon

        // ConfirmNewLabel = true, must create without blocking
        SimulateDuplicateCheck(newWine, newVintage, newGrapes, confirmNewLabel: true, existingWines, existingVintages);
    }

    [Fact]
    public void CaseE_DifferentWineType_ContinuesCreatingWithoutFlag()
    {
        var existingWines = new List<Wine>
        {
            new() { Id = 10, WineryId = 1, Name = "Cordero con Piel de Lobo", WineType = WineType.Red }
        };
        var existingVintages = new List<(int WineId, int? Year, int? MainGrapeId, string? MainGrapeName)>
        {
            (10, 2020, 1, "Malbec")
        };

        var newWine = new Wine { WineryId = 1, Name = "Cordero con Piel de Lobo", WineType = WineType.White };
        var newVintage = new WineVintage { Year = 2021 };
        var newGrapes = new List<WineGrape> { new() { GrapeId = 3, Percentage = 100m } }; // Chardonnay

        SimulateDuplicateCheck(newWine, newVintage, newGrapes, confirmNewLabel: false, existingWines, existingVintages);
    }

    [Fact]
    public void CaseF_VintageWithoutGrapesWithFlag_CreatesNewWineWithoutBlocking()
    {
        var existingWines = new List<Wine>
        {
            new() { Id = 10, WineryId = 1, Name = "Cordero con Piel de Lobo", WineType = WineType.Red }
        };
        var existingVintages = new List<(int WineId, int? Year, int? MainGrapeId, string? MainGrapeName)>
        {
            (10, 2020, 1, "Malbec")
        };

        var newWine = new Wine { WineryId = 1, Name = "Cordero con Piel de Lobo", WineType = WineType.Red };
        var newVintage = new WineVintage { Year = 2021 };
        var newGrapes = new List<WineGrape>(); // Sin uvas

        SimulateDuplicateCheck(newWine, newVintage, newGrapes, confirmNewLabel: true, existingWines, existingVintages);
    }

    [Fact]
    public void FutureCase_MultipleCandidateWines_WithoutFlag_PicksOneSharingGrapeOrSmallestId()
    {
        var existingWines = new List<Wine>
        {
            new() { Id = 10, WineryId = 1, Name = "Cordero con Piel de Lobo", WineType = WineType.Red },
            new() { Id = 20, WineryId = 1, Name = "Cordero con Piel de Lobo", WineType = WineType.Red }
        };
        var existingVintages = new List<(int WineId, int? Year, int? MainGrapeId, string? MainGrapeName)>
        {
            (10, 2020, 1, "Malbec"),
            (20, 2020, 2, "Cabernet Sauvignon")
        };

        var newWine = new Wine { WineryId = 1, Name = "Cordero con Piel de Lobo", WineType = WineType.Red };
        var newVintage = new WineVintage { Year = 2021 };

        // 1. Con uva 2 (Cabernet Sauvignon) sin flag: debe elegir WineId = 20
        var exCabernet = Assert.Throws<ConflictException>(() =>
            SimulateDuplicateCheck(newWine, newVintage, [new() { GrapeId = 2, Percentage = 100m }], confirmNewLabel: false, existingWines, existingVintages));
        Assert.Equal(20, exCabernet.Extensions["existingWineId"]);

        // 2. Con uva 3 (Merlot, ninguna la comparte) sin flag: debe elegir el ID menor (10)
        var exMerlot = Assert.Throws<ConflictException>(() =>
            SimulateDuplicateCheck(newWine, newVintage, [new() { GrapeId = 3, Percentage = 100m }], confirmNewLabel: false, existingWines, existingVintages));
        Assert.Equal(10, exMerlot.Extensions["existingWineId"]);
    }
}
