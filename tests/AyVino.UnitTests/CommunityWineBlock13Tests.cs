using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Cellars.Options;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Cellars.Services;
using Microsoft.Extensions.Options;
using NSubstitute;

namespace AyVino.UnitTests;

public class CommunityWineBlock13Tests
{
    private readonly ICellarRepository _cellarRepository = Substitute.For<ICellarRepository>();

    private CellarService CreateService(int maxPerUser = 3)
    {
        var options = Options.Create(new CellarOptions { MaxPerUser = maxPerUser });
        return new CellarService(_cellarRepository, options);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    public async Task CreateAsync_WhenUserHasFewerThanMax_CreatesSuccessfully(int currentCount)
    {
        // Arrange
        var service = CreateService(maxPerUser: 3);
        const int userId = 10;
        _cellarRepository.CountByUserAsync(userId, Arg.Any<CancellationToken>()).Returns(currentCount);
        _cellarRepository.ExistsByNameAsync(userId, "Cava Nueva", null, Arg.Any<CancellationToken>()).Returns(false);
        _cellarRepository.CreateAsync(userId, "Cava Nueva", 3, Arg.Any<CancellationToken>()).Returns(101);
        _cellarRepository.GetSummaryByIdAsync(101, userId, Arg.Any<CancellationToken>()).Returns(new CellarSummaryRow
        {
            Id = 101,
            Name = "Cava Nueva",
            CreatedAt = DateTime.UtcNow,
            BottleCount = 0,
            VintageCount = 0
        });

        // Act
        var result = await service.CreateAsync(userId, new CreateCellarRequestDto("Cava Nueva"));

        // Assert
        Assert.NotNull(result);
        Assert.Equal(101, result.Id);
        Assert.Equal("Cava Nueva", result.Name);
        await _cellarRepository.Received(1).CreateAsync(userId, "Cava Nueva", 3, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateAsync_WhenUserReachesMax_ThrowsConflictWithExactMessage()
    {
        // Arrange
        var service = CreateService(maxPerUser: 3);
        const int userId = 10;
        _cellarRepository.CountByUserAsync(userId, Arg.Any<CancellationToken>()).Returns(3);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            service.CreateAsync(userId, new CreateCellarRequestDto("Cuarta Cava")));

        Assert.Equal("Alcanzaste el máximo de 3 cavas. Borrá una para crear otra.", ex.Message);
        await _cellarRepository.DidNotReceive().CreateAsync(Arg.Any<int>(), Arg.Any<string>(), Arg.Any<int?>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteAsync_FreesUpSlot_AllowsSubsequentCreation()
    {
        // Arrange
        var service = CreateService(maxPerUser: 3);
        const int userId = 10;
        const int cellarToDeleteId = 42;

        var cellar = new Cellar { Id = cellarToDeleteId, UserId = userId, Name = "Cava Antigua", CreatedAt = DateTime.UtcNow };
        _cellarRepository.GetByIdAsync(cellarToDeleteId, userId, Arg.Any<CancellationToken>()).Returns(cellar);
        _cellarRepository.HasItemsAsync(cellarToDeleteId, Arg.Any<CancellationToken>()).Returns(false);
        _cellarRepository.DeleteAsync(cellarToDeleteId, userId, Arg.Any<CancellationToken>()).Returns(true);

        // Act - Delete
        await service.DeleteAsync(userId, cellarToDeleteId);

        // Assert Delete
        await _cellarRepository.Received(1).DeleteAsync(cellarToDeleteId, userId, Arg.Any<CancellationToken>());

        // Arrange - New creation after deletion (now count is 2)
        _cellarRepository.CountByUserAsync(userId, Arg.Any<CancellationToken>()).Returns(2);
        _cellarRepository.ExistsByNameAsync(userId, "Cava de Reemplazo", null, Arg.Any<CancellationToken>()).Returns(false);
        _cellarRepository.CreateAsync(userId, "Cava de Reemplazo", 3, Arg.Any<CancellationToken>()).Returns(102);
        _cellarRepository.GetSummaryByIdAsync(102, userId, Arg.Any<CancellationToken>()).Returns(new CellarSummaryRow
        {
            Id = 102,
            Name = "Cava de Reemplazo",
            CreatedAt = DateTime.UtcNow,
            BottleCount = 0,
            VintageCount = 0
        });

        // Act - Create
        var result = await service.CreateAsync(userId, new CreateCellarRequestDto("Cava de Reemplazo"));

        // Assert Create
        Assert.NotNull(result);
        Assert.Equal(102, result.Id);
        Assert.Equal("Cava de Reemplazo", result.Name);
    }

    [Fact]
    public async Task ConcurrentCreations_WithOneSlotRemaining_SimulatedRaceCondition_SecondCreationFails()
    {
        // Arrange
        var service = CreateService(maxPerUser: 3);
        const int userId = 10;

        // User currently has 2 cavas
        var callCount = 0;
        _cellarRepository.CountByUserAsync(userId, Arg.Any<CancellationToken>())
            .Returns(_ => 2); // Both see 2 during preliminary check

        _cellarRepository.ExistsByNameAsync(userId, Arg.Any<string>(), null, Arg.Any<CancellationToken>())
            .Returns(false);

        // In the repository layer (with lock check):
        // First creation succeeds, increments the inner count
        // Second concurrent creation encounters max reached inside the locked transaction and throws ConflictException
        _cellarRepository.CreateAsync(userId, Arg.Any<string>(), 3, Arg.Any<CancellationToken>())
            .Returns(x =>
            {
                var current = Interlocked.Increment(ref callCount);
                if (current > 1)
                {
                    throw new ConflictException("Alcanzaste el máximo de 3 cavas. Borrá una para crear otra.");
                }
                return 105;
            });

        _cellarRepository.GetSummaryByIdAsync(105, userId, Arg.Any<CancellationToken>()).Returns(new CellarSummaryRow
        {
            Id = 105,
            Name = "Cava Paralela 1",
            CreatedAt = DateTime.UtcNow
        });

        // Act
        var task1 = service.CreateAsync(userId, new CreateCellarRequestDto("Cava Paralela 1"));
        var task2 = service.CreateAsync(userId, new CreateCellarRequestDto("Cava Paralela 2"));

        var results = await Task.WhenAll(
            task1.ContinueWith(t => (Success: t.IsCompletedSuccessfully, Exception: t.Exception?.InnerException)),
            task2.ContinueWith(t => (Success: t.IsCompletedSuccessfully, Exception: t.Exception?.InnerException))
        );

        // Assert: exactly one succeeded, and the other threw 409 ConflictException
        var succeeded = results.Count(r => r.Success);
        var failed = results.Count(r => r.Exception is ConflictException ce && ce.Message.Contains("Alcanzaste el máximo de 3 cavas"));

        Assert.Equal(1, succeeded);
        Assert.Equal(1, failed);
    }

    [Fact]
    public async Task Limit_IsPerUser_OtherUserNotAffected()
    {
        // Arrange
        var service = CreateService(maxPerUser: 3);
        const int userFull = 10;
        const int userFree = 20;

        _cellarRepository.CountByUserAsync(userFull, Arg.Any<CancellationToken>()).Returns(3);
        _cellarRepository.CountByUserAsync(userFree, Arg.Any<CancellationToken>()).Returns(1);

        _cellarRepository.ExistsByNameAsync(userFree, "Cava Libre", null, Arg.Any<CancellationToken>()).Returns(false);
        _cellarRepository.CreateAsync(userFree, "Cava Libre", 3, Arg.Any<CancellationToken>()).Returns(201);
        _cellarRepository.GetSummaryByIdAsync(201, userFree, Arg.Any<CancellationToken>()).Returns(new CellarSummaryRow
        {
            Id = 201,
            Name = "Cava Libre",
            CreatedAt = DateTime.UtcNow
        });

        // Act & Assert
        // User with 3 cellars is blocked
        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            service.CreateAsync(userFull, new CreateCellarRequestDto("Cava Bloqueada")));
        Assert.Equal("Alcanzaste el máximo de 3 cavas. Borrá una para crear otra.", ex.Message);

        // User with 1 cellar can create freely
        var result = await service.CreateAsync(userFree, new CreateCellarRequestDto("Cava Libre"));
        Assert.NotNull(result);
        Assert.Equal(201, result.Id);
    }

    [Fact]
    public async Task UserAboveMax_CanStillRenameAndDelete()
    {
        // Arrange
        var service = CreateService(maxPerUser: 3);
        const int userId = 10;
        const int existingCellarId = 99;

        var cellar = new Cellar { Id = existingCellarId, UserId = userId, Name = "Viejo Nombre", CreatedAt = DateTime.UtcNow };
        _cellarRepository.GetByIdAsync(existingCellarId, userId, Arg.Any<CancellationToken>()).Returns(cellar);
        _cellarRepository.ExistsByNameAsync(userId, "Nuevo Nombre", existingCellarId, Arg.Any<CancellationToken>()).Returns(false);
        _cellarRepository.UpdateNameAsync(existingCellarId, userId, "Nuevo Nombre", Arg.Any<CancellationToken>()).Returns(true);
        _cellarRepository.GetSummaryByIdAsync(existingCellarId, userId, Arg.Any<CancellationToken>()).Returns(new CellarSummaryRow
        {
            Id = existingCellarId,
            Name = "Nuevo Nombre",
            CreatedAt = DateTime.UtcNow
        });

        _cellarRepository.HasItemsAsync(existingCellarId, Arg.Any<CancellationToken>()).Returns(false);
        _cellarRepository.DeleteAsync(existingCellarId, userId, Arg.Any<CancellationToken>()).Returns(true);

        // Act - Rename
        var renameResult = await service.RenameAsync(userId, existingCellarId, new UpdateCellarRequestDto("Nuevo Nombre"));

        // Assert - Rename
        Assert.Equal("Nuevo Nombre", renameResult.Name);
        await _cellarRepository.Received(1).UpdateNameAsync(existingCellarId, userId, "Nuevo Nombre", Arg.Any<CancellationToken>());

        // Act - Delete
        await service.DeleteAsync(userId, existingCellarId);

        // Assert - Delete
        await _cellarRepository.Received(1).DeleteAsync(existingCellarId, userId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task MaxPerUser_IsConfiguredViaOptions_ReflectsCustomLimit()
    {
        // Arrange - custom configured limit of 5
        var service = CreateService(maxPerUser: 5);
        const int userId = 10;

        _cellarRepository.CountByUserAsync(userId, Arg.Any<CancellationToken>()).Returns(3);
        _cellarRepository.ExistsByNameAsync(userId, "Cuarta Cava", null, Arg.Any<CancellationToken>()).Returns(false);
        _cellarRepository.CreateAsync(userId, "Cuarta Cava", 5, Arg.Any<CancellationToken>()).Returns(104);
        _cellarRepository.GetSummaryByIdAsync(104, userId, Arg.Any<CancellationToken>()).Returns(new CellarSummaryRow
        {
            Id = 104,
            Name = "Cuarta Cava",
            CreatedAt = DateTime.UtcNow
        });

        // Act - Create 4th cellar (allowed because max is 5)
        var result = await service.CreateAsync(userId, new CreateCellarRequestDto("Cuarta Cava"));
        Assert.NotNull(result);

        // Now user has 5 cellars
        _cellarRepository.CountByUserAsync(userId, Arg.Any<CancellationToken>()).Returns(5);

        // Act & Assert - 6th cellar rejected with exact message showing 5
        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            service.CreateAsync(userId, new CreateCellarRequestDto("Sexta Cava")));
        Assert.Equal("Alcanzaste el máximo de 5 cavas. Borrá una para crear otra.", ex.Message);
    }
}
