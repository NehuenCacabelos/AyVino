using AyVino.Api.Features.Wineries.DTOs;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Services;
using Xunit;

namespace AyVino.UnitTests;

public class UsuarioBloqueU5Tests
{
    private class FakeWineryRepo : IWineryRepository
    {
        public string? LastSearchKey { get; private set; }
        public int CallCount { get; private set; }
        public List<WinerySuggestItemDto> Results { get; set; } = [];

        public Task<Winery?> GetByIdAsync(int id, CancellationToken ct = default) => Task.FromResult<Winery?>(null);
        public Task<Winery?> GetByUserIdAsync(int userId, CancellationToken ct = default) => Task.FromResult<Winery?>(null);
        public Task<IEnumerable<Winery>> GetAllAsync(int pageNumber, int pageSize, int? status = null, int? locationId = null, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<Winery>>(Array.Empty<Winery>());
        public Task<Winery> CreateAsync(Winery winery, CancellationToken ct = default) => Task.FromResult(winery);
        public Task<bool> UpdateAsync(Winery winery, CancellationToken ct = default) => Task.FromResult(true);
        public Task<bool> DeleteAsync(int id, CancellationToken ct = default) => Task.FromResult(true);
        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) => Task.FromResult(true);
        public Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default) => Task.FromResult(true);

        public Task<IReadOnlyList<WinerySuggestItemDto>> SuggestAsync(string searchKey, CancellationToken ct = default)
        {
            LastSearchKey = searchKey;
            CallCount++;
            return Task.FromResult<IReadOnlyList<WinerySuggestItemDto>>(Results);
        }
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("a")]
    [InlineData("  .  ")]
    public async Task SuggestAsync_WhenQueryHasLessThanTwoChars_ReturnsEmptyListWithoutCallingRepo(string? query)
    {
        var fakeRepo = new FakeWineryRepo();
        var service = new WineryService(fakeRepo, null!, null!, null!, null!, null!);

        var result = await service.SuggestAsync(query);

        Assert.Empty(result);
        Assert.Equal(0, fakeRepo.CallCount);
    }

    [Fact]
    public async Task SuggestAsync_WhenQueryIsValid_NormalizesKeyAndReturnsRepoResults()
    {
        var fakeRepo = new FakeWineryRepo
        {
            Results =
            [
                new(1, "Bodega Catena Zapata"),
                new(2, "Catena Wines")
            ]
        };
        var service = new WineryService(fakeRepo, null!, null!, null!, null!, null!);

        var result = await service.SuggestAsync("Catena Zapata!");

        Assert.Equal(2, result.Count);
        Assert.Equal("Bodega Catena Zapata", result[0].Name);
        Assert.Equal("catenazapata", fakeRepo.LastSearchKey);
        Assert.Equal(1, fakeRepo.CallCount);
    }

    [Fact]
    public async Task SuggestAsync_NormalizesAccentsAndPunctuation()
    {
        var fakeRepo = new FakeWineryRepo
        {
            Results =
            [
                new(10, "Viña Las Perdices")
            ]
        };
        var service = new WineryService(fakeRepo, null!, null!, null!, null!, null!);

        var result = await service.SuggestAsync("  Viña Las Perdíces -  ");

        Assert.Single(result);
        Assert.Equal(10, result[0].Id);
        Assert.Equal("vinalasperdices", fakeRepo.LastSearchKey);
        Assert.Equal(1, fakeRepo.CallCount);
    }
}
