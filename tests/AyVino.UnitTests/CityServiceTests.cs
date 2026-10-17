using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Locations.Models;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Locations.Services;
using NSubstitute;

namespace AyVino.UnitTests;

public class CityServiceTests
{
    private readonly ICityRepository _cityRepository = Substitute.For<ICityRepository>();
    private readonly IStateRepository _stateRepository = Substitute.For<IStateRepository>();
    private readonly CityService _cityService;

    public CityServiceTests()
    {
        _cityService = new CityService(_cityRepository, _stateRepository);
    }

    [Fact]
    public async Task GetAllAsync_ValidPagination_ReturnsMappedCityResponseDtos()
    {
        // Arrange
        var cities = new List<City>
        {
            new() { Id = 1, Name = "Mendoza", StateId = 1, Status = AyVino.Api.Features.Locations.Enums.CityStatus.Approved },
            new() { Id = 2, Name = "San Rafael", StateId = 1, Status = AyVino.Api.Features.Locations.Enums.CityStatus.Approved }
        };

        _cityRepository.GetAllAsync(1, 10, null, null, Arg.Any<CancellationToken>())
            .Returns(cities);

        // Act
        var result = (await _cityService.GetAllAsync(1, 10, null, null)).ToList();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal("Mendoza", result[0].Name);
        Assert.Equal("San Rafael", result[1].Name);
        await _cityRepository.Received(1).GetAllAsync(1, 10, null, null, Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(-1, 10)]
    public async Task GetAllAsync_InvalidPageNumber_ThrowsValidationException(int pageNumber, int pageSize)
    {
        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _cityService.GetAllAsync(pageNumber, pageSize, null, null));
        Assert.Contains("Page number", ex.Message, StringComparison.OrdinalIgnoreCase);
        await _cityRepository.DidNotReceive().GetAllAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<int?>(), Arg.Any<int?>(), Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(1, 0)]
    [InlineData(1, -5)]
    [InlineData(1, 101)]
    public async Task GetAllAsync_InvalidPageSize_ThrowsValidationException(int pageNumber, int pageSize)
    {
        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => _cityService.GetAllAsync(pageNumber, pageSize, null, null));
        Assert.Contains("Page size", ex.Message, StringComparison.OrdinalIgnoreCase);
        await _cityRepository.DidNotReceive().GetAllAsync(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<int?>(), Arg.Any<int?>(), Arg.Any<CancellationToken>());
    }
}
