using NSubstitute;
using AyVino.Api.Features.Locations.Services;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Common.Security.Jwt;
using AyVino.Api.Features.Locations.Models;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Models;
using AyVino.Api.Features.Users.Services;
using AyVino.Api.Features.Wineries.DTOs;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Services;

namespace AyVino.UnitTests;

public class WineryServiceTests
{
    private static WineryService CreateService(
        IWineryRepository wineryRepo,
        ILocationRepository? locationRepo = null,
        IUserService? userService = null,
        IJwtTokenGenerator? jwtGenerator = null,
        ICityRepository? cityRepo = null,
        IGeorefClient? georefClient = null,
        IImageStorage? imageStorage = null) =>
        new(
            wineryRepo,
            locationRepo ?? Substitute.For<ILocationRepository>(),
            cityRepo ?? Substitute.For<ICityRepository>(),
            georefClient ?? Substitute.For<IGeorefClient>(),
            userService ?? Substitute.For<IUserService>(),
            jwtGenerator ?? Substitute.For<IJwtTokenGenerator>(),
            imageStorage);


    [Fact]
    public async Task CreateAsync_ValidRequest_MapsToEntityAndReturnsResponseDto()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository();
        var fakeLocationRepo = new FakeLocationRepository { ExistingLocationId = 1 };
        var service = CreateService(fakeWineryRepo, fakeLocationRepo);

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
        var service = CreateService(fakeWineryRepo, fakeLocationRepo);

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
        var service = CreateService(fakeWineryRepo, fakeLocationRepo);

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
        var service = CreateService(fakeWineryRepo, fakeLocationRepo);

        var dto = new UpdateWineryRequestDto("Updated Name", 1, "Updated Desc", 1950, "https://updated.com");

        // Act
        var result = await service.UpdateAsync(1, dto, new Actor(1, AppRoles.Admin));

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
        var service = CreateService(fakeWineryRepo, fakeLocationRepo);

        var dto = new UpdateWineryRequestDto("Any Name", 1, null, null, null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.UpdateAsync(999, dto, new Actor(1, AppRoles.Admin)));
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
        var service = CreateService(fakeWineryRepo, new FakeLocationRepository());

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
        var service = CreateService(fakeWineryRepo, new FakeLocationRepository());

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.GetByIdAsync(999));
    }

    [Fact]
    public async Task GetByUserIdAsync_ExistingWineryForUser_ReturnsResponseDto()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository
        {
            ExistingWinery = new Winery
            {
                Id = 15,
                Name = "Bodega Los Andes",
                LocationId = 1,
                UserId = 77,
                Status = WineryStatus.Approved,
                RegisterDate = DateTime.UtcNow
            }
        };
        var service = CreateService(fakeWineryRepo);

        // Act
        var result = await service.GetByUserIdAsync(77);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(15, result.Id);
        Assert.Equal("Bodega Los Andes", result.Name);
        Assert.Equal(WineryStatus.Approved.ToString(), result.Status);
    }

    [Fact]
    public async Task GetByUserIdAsync_NoWineryForUser_ThrowsNotFoundException()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository();
        var service = CreateService(fakeWineryRepo);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.GetByUserIdAsync(99));
    }

    [Fact]
    public async Task DeleteAsync_WineryExists_DeletesSuccessfully()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository
        {
            ExistingWinery = new Winery { Id = 5, Name = "To Delete" }
        };
        var service = CreateService(fakeWineryRepo, new FakeLocationRepository());

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
        var service = CreateService(fakeWineryRepo, new FakeLocationRepository());

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.DeleteAsync(999));
    }

    [Fact]
    public async Task RegisterWineryAsync_ValidRequest_RegistersUserAndWineryAndReturnsToken()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository();
        var fakeLocationRepo = new FakeLocationRepository { ExistingLocationId = 1 };
        var fakeUserService = new FakeUserService();
        var fakeJwtGenerator = new FakeJwtTokenGenerator();
        var service = CreateService(fakeWineryRepo, fakeLocationRepo, fakeUserService, fakeJwtGenerator);

        var dto = new RegisterWineryRequestDto(
            Username: "catena_admin",
            Email: "admin@catenazapata.com",
            Password: "Password123!",
            WineryName: "Catena Zapata",
            LocationId: 1,
            Description: "Bodega histórica en Mendoza",
            FoundationYear: 1902,
            Website: "https://catenazapata.com"
        );

        // Act
        var result = await service.RegisterWineryAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Bearer", result.TokenType);
        Assert.Equal("fake-jwt-token-xyz", result.AccessToken);
        Assert.NotNull(result.Winery);
        Assert.Equal("Catena Zapata", result.Winery.Name);
        Assert.Equal(WineryStatus.Pending.ToString(), result.Winery.Status);

        // User service asserted
        Assert.NotNull(fakeUserService.CapturedRegisterDto);
        Assert.Equal("catena_admin", fakeUserService.CapturedRegisterDto.Username);
        Assert.Equal("Winery", fakeUserService.CapturedRegisterDto.Role);

        // Winery repo asserted
        Assert.NotNull(fakeWineryRepo.CapturedCreatedWinery);
        Assert.Equal("Catena Zapata", fakeWineryRepo.CapturedCreatedWinery.Name);
        Assert.Equal(100, fakeWineryRepo.CapturedCreatedWinery.UserId);
        Assert.Equal(WineryStatus.Pending, fakeWineryRepo.CapturedCreatedWinery.Status);

        // JWT asserted
        Assert.NotNull(fakeJwtGenerator.CapturedUser);
        Assert.Equal(100, fakeJwtGenerator.CapturedUser.Id);
    }

    [Fact]
    public async Task RegisterWineryAsync_WineryInsertFails_CompensatesByDeletingCreatedUser()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository { ShouldFailCreate = true };
        var fakeLocationRepo = new FakeLocationRepository { ExistingLocationId = 1 };
        var fakeUserService = new FakeUserService();
        var fakeJwtGenerator = new FakeJwtTokenGenerator();
        var service = CreateService(fakeWineryRepo, fakeLocationRepo, fakeUserService, fakeJwtGenerator);

        var dto = new RegisterWineryRequestDto(
            Username: "faulty_admin",
            Email: "admin@faulty.com",
            Password: "Password123!",
            WineryName: "Faulty Winery",
            LocationId: 1
        );

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RegisterWineryAsync(dto));

        // Compensation verification
        Assert.Equal(100, fakeUserService.CapturedDeletedUserId);
    }

    [Fact]
    public async Task RegisterWineryAsync_InvalidWineryName_ThrowsValidationException()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository();
        var fakeLocationRepo = new FakeLocationRepository { ExistingLocationId = 1 };
        var fakeUserService = new FakeUserService();
        var fakeJwtGenerator = new FakeJwtTokenGenerator();
        var service = CreateService(fakeWineryRepo, fakeLocationRepo, fakeUserService, fakeJwtGenerator);

        var dto = new RegisterWineryRequestDto(
            Username: "admin_user",
            Email: "admin@user.com",
            Password: "Password123!",
            WineryName: "",
            LocationId: 1
        );

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.RegisterWineryAsync(dto));
        Assert.Contains("winery name is required", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Null(fakeUserService.CapturedRegisterDto);
    }

    [Fact]
    public async Task RegisterWineryAsync_NonExistentLocation_ThrowsValidationException()
    {
        // Arrange
        var fakeWineryRepo = new FakeWineryRepository();
        var fakeLocationRepo = new FakeLocationRepository { ExistingLocationId = 1 };
        var fakeUserService = new FakeUserService();
        var fakeJwtGenerator = new FakeJwtTokenGenerator();
        var service = CreateService(fakeWineryRepo, fakeLocationRepo, fakeUserService, fakeJwtGenerator);

        var dto = new RegisterWineryRequestDto(
            Username: "admin_user",
            Email: "admin@user.com",
            Password: "Password123!",
            WineryName: "Bodega Valida",
            LocationId: 999
        );

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.RegisterWineryAsync(dto));
        Assert.Contains("Location with ID 999 does not exist", ex.Message);
        Assert.Null(fakeUserService.CapturedRegisterDto);
    }

    #region Fakes

    private sealed class FakeWineryRepository : IWineryRepository
    {
        public Winery? ExistingWinery { get; set; }
        public Winery? CapturedCreatedWinery { get; private set; }
        public Winery? CapturedUpdatedWinery { get; private set; }
        public bool ShouldFailCreate { get; set; }

        public Task<Winery?> GetByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingWinery?.Id == id ? ExistingWinery : null);

        public Task<Winery?> GetByUserIdAsync(int userId, CancellationToken ct = default) =>
            Task.FromResult(ExistingWinery?.UserId == userId ? ExistingWinery : null);

        public Task<IEnumerable<Winery>> GetAllAsync(int pageNumber, int pageSize, int? status = null, int? locationId = null, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<Winery>>(ExistingWinery is not null ? [ExistingWinery] : []);

        public Task<Winery> CreateAsync(Winery winery, CancellationToken ct = default)
        {
            if (ShouldFailCreate)
                throw new InvalidOperationException("Simulated database failure on winery insert");

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

        public Task<Location?> GetByCityIdAsync(int cityId, CancellationToken ct = default) =>
            Task.FromResult<Location?>(null);

        public Task<int> CreateAsync(Location location, CancellationToken ct = default) =>
            Task.FromResult(1);

        public Task<bool> ExistsByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(ExistingLocationId == id);

        public Task<IEnumerable<Location>> GetAllAsync(int pageNumber, int pageSize, CancellationToken ct = default) =>
            Task.FromResult<IEnumerable<Location>>([]);
    }

    private sealed class FakeUserService : IUserService
    {
        public CreateUserRequestDto? CapturedRegisterDto { get; private set; }
        public int? CapturedDeletedUserId { get; private set; }
        public UserResponseDto RegisteredUser { get; set; } = new(100, "winery_admin", "admin@bodega.com", "Winery", DateTime.UtcNow, true, null, null);

        public Task<UserResponseDto> RegisterAsync(CreateUserRequestDto dto, CancellationToken ct = default)
        {
            CapturedRegisterDto = dto;
            return Task.FromResult(RegisteredUser with { Username = dto.Username, Email = dto.Email, Role = dto.Role ?? "Winery" });
        }

        public Task DeleteAsync(int id, CancellationToken ct = default)
        {
            CapturedDeletedUserId = id;
            return Task.CompletedTask;
        }

        public Task<UserResponseDto> GetByIdAsync(int id, CancellationToken ct = default) => throw new NotImplementedException();
        public Task<UserResponseDto> GetByEmailAsync(string email, CancellationToken ct = default) => throw new NotImplementedException();
        public Task<IEnumerable<UserResponseDto>> GetAllAsync(int pageNumber, int pageSize, CancellationToken ct = default) => throw new NotImplementedException();
        public Task<UserResponseDto> UpdateProfileAsync(int id, UpdateUserProfileRequestDto dto, CancellationToken ct = default) => throw new NotImplementedException();
        public Task ChangeStatusAsync(int id, bool isActive, CancellationToken ct = default) => throw new NotImplementedException();
    }

    private sealed class FakeJwtTokenGenerator : IJwtTokenGenerator
    {
        public User? CapturedUser { get; private set; }
        public (string Token, DateTime ExpiresAt) GenerateToken(User user)
        {
            CapturedUser = user;
            return ("fake-jwt-token-xyz", DateTime.UtcNow.AddHours(2));
        }
    }

    #endregion
}
