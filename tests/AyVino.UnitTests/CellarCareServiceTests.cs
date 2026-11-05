using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Cellars.Services;
using AyVino.Api.Features.WineCare.DTOs;
using AyVino.Api.Features.WineCare.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class CellarCareServiceTests
{
    private readonly ICellarRepository _cellarRepository = Substitute.For<ICellarRepository>();
    private readonly ICellarItemRepository _itemRepository = Substitute.For<ICellarItemRepository>();
    private readonly IWineCareService _wineCareService = Substitute.For<IWineCareService>();
    private readonly CellarCareService _cellarCareService;

    public CellarCareServiceTests()
    {
        _cellarCareService = new CellarCareService(_cellarRepository, _itemRepository, _wineCareService);
    }

    [Fact]
    public async Task GetSummaryAsync_CellarNotFoundOrBelongsToAnotherUser_ThrowsNotFoundException()
    {
        // Arrange
        _cellarRepository.GetByIdAsync(10, 1, Arg.Any<CancellationToken>()).Returns((Cellar?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() => _cellarCareService.GetSummaryAsync(1, 10));
        Assert.Contains("Cava con ID 10 no encontrada", ex.Message, StringComparison.OrdinalIgnoreCase);
        await _wineCareService.DidNotReceive().GetForVintagesAsync(Arg.Any<IReadOnlyList<int>>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetSummaryAsync_CellarOwnedByUser_FetchesCareSummaryForVintages()
    {
        // Arrange
        var cellar = new Cellar { Id = 10, UserId = 1, Name = "Mi Cava", CreatedAt = DateTime.UtcNow };
        _cellarRepository.GetByIdAsync(10, 1, Arg.Any<CancellationToken>()).Returns(cellar);
        _itemRepository.GetVintageIdsAsync(10, Arg.Any<CancellationToken>()).Returns([101, 102]);

        var careResponses = new List<WineCareResponseDto>
        {
            new(101, new ServingTemperatureDto(16, 18, "Heuristics"), new DecantingDto(false, null, "No necesario"), null, null),
            new(102, new ServingTemperatureDto(10, 12, "Winery"), new DecantingDto(true, 30, "Recomendado por bodega"), null, null)
        };
        _wineCareService.GetForVintagesAsync(Arg.Is<IReadOnlyList<int>>(ids => ids.Count == 2), Arg.Any<CancellationToken>())
            .Returns(careResponses);

        // Act
        var result = await _cellarCareService.GetSummaryAsync(1, 10);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal(101, result[0].WineVintageId);
        Assert.Equal(102, result[1].WineVintageId);
        await _wineCareService.Received(1).GetForVintagesAsync(Arg.Any<IReadOnlyList<int>>(), Arg.Any<CancellationToken>());
    }
}
