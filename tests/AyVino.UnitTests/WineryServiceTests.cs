using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Locations.Models;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Wineries.DTOs;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Services;

namespace AyVino.UnitTests;

public class WineryServiceTests
{
    [Fact]
    public async Task CreateAsync_ValidRequest_MapsToEntityAndReturnsResponseDto()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository();
        var fakeLocationRepo = new FakeLocationRepository { ExistingLocationId = 1 };
        var service = new WineryService(fakeWineryRepo, fakeLocationRepo, null!, null!);

        var dto = new CreateWineryRequestDto("Bodega Bianchi", 1, "Familia Bianchi", 1928, "https://bianchi.com");

        // Act
        var result = await service.CreateAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Bodega Bianchi", result.Name);
        Assert.Equal(1, result.LocationId);
        Assert.Equal(WineryStatus.Pending.ToString(), result.Status);

        Assert.NotNull(fakeWineryRepo.CapturedCreatedWinery);
        Assert.Equal("Bodega Bianchi", fakeWineryRepo.CapturedCreatedWinery.Name);
        Assert.Equal(WineryStatus.Pending, fakeWineryRepo.CapturedCreatedWinery.Status);
        Assert.Null(fakeWineryRepo.CapturedCreatedWinery.UserId);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateAsync_InvalidName_ThrowsValidationException(string name)
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository();
        var fakeLocationRepo = new FakeLocationRepository { ExistingLocationId = 1 };
        var service = new WineryService(fakeWineryRepo, fakeLocationRepo, null!, null!);

        var dto = new CreateWineryRequestDto(name, 1, "Desc", 1928, null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(dto));
        Assert.Contains("name is required", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateAsync_NonExistentLocation_ThrowsValidationException()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository();
        var fakeLocationRepo = new FakeLocationRepository { ExistingLocationId = null };
        var service = new WineryService(fakeWineryRepo, fakeLocationRepo, null!, null!);

        var dto = new CreateWineryRequestDto("Bodega Test", 999, "Desc", 2000, null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(dto));
        Assert.Contains("Location with ID 999 does not exist", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_WineryExists_MapsToEntityAndReturnsUpdatedResponseDto()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository
        {
            ExistingWinery = new Winery
            {
                Id = 1,
                Name = "Original Name",
                LocationId = 1,
                Status = WineryStatus.Approved,
                RegisterDate = DateTime.UtcNow
            }
        };
        var fakeLocationRepo = new FakeLocationRepository { ExistingLocationId = 1 };
        var service = new WineryService(fakeWineryRepo, fakeLocationRepo, null!, null!);

        var dto = new UpdateWineryRequestDto("Updated Name", 1, "Updated Desc", 1950, "https://updated.com");

        // Act
        var result = await service.UpdateAsync(1, dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Name", result.Name);
        Assert.NotNull(fakeWineryRepo.CapturedUpdatedWinery);
        Assert.Equal(1, fakeWineryRepo.CapturedUpdatedWinery.Id);
        Assert.Equal("Updated Name", fakeWineryRepo.CapturedUpdatedWinery.Name);
    }

    [Fact]
    public async Task UpdateAsync_WineryNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository { ExistingWinery = null };
        var fakeLocationRepo = new FakeLocationRepository { ExistingLocationId = 1 };
        var service = new WineryService(fakeWineryRepo, fakeLocationRepo, null!, null!);

        var dto = new UpdateWineryRequestDto("Any Name", 1, null, null, null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.UpdateAsync(999, dto));
    }

    [Fact]
    public async Task GetByIdAsync_WineryExists_ReturnsResponseDto()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository
        {
            ExistingWinery = new Winery
            {
                Id = 10,
                Name = "Catena Zapata",
                LocationId = 1,
                Status = WineryStatus.Approved,
                RegisterDate = DateTime.UtcNow
            }
        };
        var service = new WineryService(fakeWineryRepo, new FakeLocationRepository(), null!, null!);

        // Act
        var result = await service.GetByIdAsync(10);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.Id);
        Assert.Equal("Catena Zapata", result.Name);
    }

    [Fact]
    public async Task GetByIdAsync_WineryNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository { ExistingWinery = null };
        var service = new WineryService(fakeWineryRepo, new FakeLocationRepository(), null!, null!);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.GetByIdAsync(999));
    }

    [Fact]
    public async Task DeleteAsync_WineryExists_DeletesSuccessfully()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository
        {
            ExistingWinery = new Winery { Id = 5, Name = "To Delete" }
        };
        var service = new WineryService(fakeWineryRepo, new FakeLocationRepository(), null!, null!);

        // Act
        await service.DeleteAsync(5);

        // Assert
        Assert.Null(fakeWineryRepo.ExistingWinery);
    }

    [Fact]
    public async Task DeleteAsync_WineryNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository { ExistingWinery = null };
        var service = new WineryService(fakeWineryRepo, new FakeLocationRepository(), null!, null!);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.DeleteAsync(999));
    }

    #region Fakes

    private sealed class FakeWineryRepository : IWineryRepository
    {
        public Winery? ExistingWinery { get; set; }
        public Winery? CapturedCreatedWinery { get; private set; }
        public Winery? CapturedUpdatedWinery { get; private set; }

        public Task<Winery?> GetByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingWinery?.Id == id ? ExistingWinery : null);

        public Task<IEnumerable<Winery>> GetAllAsync(int pageNumber, int pageSize, int? status = null, int? locationId = null, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<Winery>>(ExistingWinery is not null ? [ExistingWinery] : []);

        public Task<Winery> CreateAsync(Winery winery, CancellationToken ct = default)
        {
            CapturedCreatedWinery = winery;
            var created = winery with { Id = 42 };
            ExistingWinery = created;
            return Task.FromResult(created);
        }

        public Task<bool> UpdateAsync(Winery winery, CancellationToken ct = default)
        {
            CapturedUpdatedWinery = winery;
            if (ExistingWinery?.Id == winery.Id)
            {
                ExistingWinery = winery with { Status = ExistingWinery.Status, RegisterDate = ExistingWinery.RegisterDate };
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }

        public Task<bool> DeleteAsync(int id, CancellationToken ct = default)
        {
            if (ExistingWinery?.Id == id)
            {
                ExistingWinery = null;
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }

        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingWinery?.Id == id);

        public Task<bool> UpdateStatusAsync(int id, int status, CancellationToken ct = default)
        {
            if (ExistingWinery?.Id == id)
            {
                ExistingWinery = ExistingWinery with { Status = (WineryStatus)status };
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }
    }

    private sealed class FakeLocationRepository : ILocationRepository
    {
        public int? ExistingLocationId { get; set; }

        public Task<Location?> GetByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult<Location?>(null);

        public Task<int> CreateAsync(Location location, CancellationToken ct = default) =>
            Task.FromResult(1);

        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingLocationId == id);

        public Task<IEnumerable<Location>> GetAllAsync(int pageNumber, int pageSize, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<Location>>([]);
    }

    #endregion
}

