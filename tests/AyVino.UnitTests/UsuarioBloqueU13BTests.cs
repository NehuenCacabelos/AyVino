using System.Text.Json;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Cellars.Services;
using AyVino.Api.Features.Tastings.DTOs;
using AyVino.Api.Features.Tastings.Repositories;
using AyVino.Api.Features.Tastings.Services;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Models;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Repositories;
using NSubstitute;
using Xunit;

namespace AyVino.UnitTests;

public class UsuarioBloqueU13BTests
{
    // ==========================================
    // 1. Validaciones del servicio de catas (TastingService)
    // ==========================================
    [Fact]
    public async Task TastingService_CommentWithoutRating_ThrowsValidationException()
    {
        var tastingRepo = Substitute.For<ITastingRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new TastingService(tastingRepo, vintageRepo, cellarRepo);

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.RecordAsync(1, 10, null, rating: null, comment: "Excelente vino", null));

        Assert.Equal("El comentario requiere una calificación.", ex.Message);
        await tastingRepo.DidNotReceive().RecordTastingInTransactionAsync(
            Arg.Any<int>(), Arg.Any<int>(), Arg.Any<int?>(), Arg.Any<decimal?>(), Arg.Any<string?>(), Arg.Any<DateTime>());
    }

    [Fact]
    public async Task TastingService_InvalidRating_ThrowsValidationException()
    {
        var tastingRepo = Substitute.For<ITastingRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new TastingService(tastingRepo, vintageRepo, cellarRepo);

        // Rating > 5.0
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.RecordAsync(1, 10, null, rating: 5.5m, comment: "Excedido", null));

        Assert.Equal("El rating debe estar entre 1 y 5.", ex.Message);

        // Rating con más de 1 decimal
        var exDec = await Assert.ThrowsAsync<ValidationException>(() =>
            service.RecordAsync(1, 10, null, rating: 4.55m, comment: null, null));

        Assert.Equal("El rating solo puede tener un decimal.", exDec.Message);
    }

    [Fact]
    public async Task TastingService_FutureTastedAt_ThrowsValidationException()
    {
        var tastingRepo = Substitute.For<ITastingRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new TastingService(tastingRepo, vintageRepo, cellarRepo);

        var future = DateTime.UtcNow.AddMinutes(10);
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.RecordAsync(1, 10, null, rating: 4.0m, comment: null, future));

        Assert.Equal("La fecha de la cata no puede ser futura.", ex.Message);
    }

    [Fact]
    public async Task TastingService_TooAncientTastedAt_ThrowsValidationException()
    {
        var tastingRepo = Substitute.For<ITastingRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new TastingService(tastingRepo, vintageRepo, cellarRepo);

        var ancient = new DateTime(1899, 12, 31, 23, 59, 59, DateTimeKind.Utc);
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.RecordAsync(1, 10, null, rating: 4.0m, comment: null, ancient));

        Assert.Equal("La fecha de la cata no puede ser anterior a 1900.", ex.Message);
    }

    [Fact]
    public async Task TastingService_NonExistentVintage_ThrowsNotFoundException()
    {
        var tastingRepo = Substitute.For<ITastingRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new TastingService(tastingRepo, vintageRepo, cellarRepo);

        vintageRepo.ExistsByIdAsync(999).Returns(false);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.RecordAsync(1, 999, null, rating: 4.0m, comment: null, null));
    }

    [Fact]
    public async Task TastingService_ForeignCellar_ThrowsNotFoundException()
    {
        var tastingRepo = Substitute.For<ITastingRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new TastingService(tastingRepo, vintageRepo, cellarRepo);

        vintageRepo.ExistsByIdAsync(10).Returns(true);
        cellarRepo.GetByIdAsync(50, 1).Returns((Cellar?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.RecordAsync(1, 10, 50, rating: 4.0m, comment: null, null));
    }

    // ==========================================
    // 2. Registro de cata con y sin cava
    // ==========================================
    [Fact]
    public async Task TastingService_RecordWithCellar_CallsRepoAndReturnsResult()
    {
        var tastingRepo = Substitute.For<ITastingRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new TastingService(tastingRepo, vintageRepo, cellarRepo);

        vintageRepo.ExistsByIdAsync(10).Returns(true);
        cellarRepo.GetByIdAsync(5, 1).Returns(new Cellar { Id = 5, UserId = 1, Name = "Mi Cava" });

        var expectedTasting = new TastingResponseDto(1, 1, 100, 10, 5, 4.3m, "Excelente", DateTime.UtcNow, DateTime.UtcNow);
        var expectedCellarItem = new CellarItemListRow { WineVintageId = 10, Quantity = 2 };
        tastingRepo.RecordTastingInTransactionAsync(1, 10, 5, 4.3m, "Excelente", Arg.Any<DateTime>())
            .Returns(new TastingExecutionResult(expectedTasting, expectedCellarItem));

        var result = await service.RecordAsync(1, 10, 5, 4.3m, "Excelente", null);

        Assert.NotNull(result);
        Assert.Equal(1, result.Tasting.Id);
        Assert.Equal(4.3m, result.Tasting.Rating);
        Assert.Equal("Excelente", result.Tasting.Comment);
        Assert.NotNull(result.UpdatedCellarItem);
        Assert.Equal(2, result.UpdatedCellarItem.Quantity);
    }

    [Fact]
    public async Task TastingService_RecordWithoutCellar_CallsRepoWithNullCellarId()
    {
        var tastingRepo = Substitute.For<ITastingRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new TastingService(tastingRepo, vintageRepo, cellarRepo);

        vintageRepo.ExistsByIdAsync(10).Returns(true);

        var expectedTasting = new TastingResponseDto(2, 1, 100, 10, null, 3.8m, null, DateTime.UtcNow, DateTime.UtcNow);
        tastingRepo.RecordTastingInTransactionAsync(1, 10, null, 3.8m, null, Arg.Any<DateTime>())
            .Returns(new TastingExecutionResult(expectedTasting, null));

        var result = await service.RecordAsync(1, 10, null, 3.8m, null, null);

        Assert.NotNull(result);
        Assert.Null(result.UpdatedCellarItem);
        Assert.Equal(3.8m, result.Tasting.Rating);
        await cellarRepo.DidNotReceive().GetByIdAsync(Arg.Any<int>(), Arg.Any<int>());
    }

    // ==========================================
    // 3. Paginación y lectura de catas (GetPagedByUserIdAsync)
    // ==========================================
    [Fact]
    public async Task TastingService_GetPagedByUserIdAsync_ValidatesPagination()
    {
        var tastingRepo = Substitute.For<ITastingRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new TastingService(tastingRepo, vintageRepo, cellarRepo);

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.GetPagedByUserIdAsync(1, 0, 10));

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.GetPagedByUserIdAsync(1, 1, 101));
    }

    [Fact]
    public async Task TastingService_GetPagedByUserIdAsync_ReturnsUserTastings()
    {
        var tastingRepo = Substitute.For<ITastingRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new TastingService(tastingRepo, vintageRepo, cellarRepo);

        var list = new List<TastingListItemDto>
        {
            new(1, 100, 10, "Malbec Gran Reserva", "Zuccardi", 2020, null, 4.5m, "Muy buen cuerpo", DateTime.UtcNow, "Cava Principal")
        };
        tastingRepo.GetPagedByUserIdAsync(1, 1, 10, 10).Returns(list);

        var result = await service.GetPagedByUserIdAsync(1, 1, 10, 10);

        Assert.Single(result);
        var item = result.First();
        Assert.Equal("Malbec Gran Reserva", item.WineName);
        Assert.Equal(4.5m, item.Rating);
        Assert.Equal("Cava Principal", item.CellarName);
    }

    // ==========================================
    // 4. Integración con CellarItemService.UncorkAsync
    // ==========================================
    [Fact]
    public async Task CellarItemService_UncorkAsync_DelegatesToTastingService()
    {
        var cellarRepo = Substitute.For<ICellarRepository>();
        var itemRepo = Substitute.For<ICellarItemRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var tastingService = Substitute.For<ITastingService>();

        var service = new CellarItemService(cellarRepo, itemRepo, vintageRepo, tastingService: tastingService);

        var updatedCellarRow = new CellarItemListRow
        {
            WineVintageId = 10,
            WineId = 100,
            Name = "Vino Test",
            WineType = WineType.Red,
            Quantity = 1,
            LastChangeAt = DateTime.UtcNow
        };
        var tastingDto = new TastingResponseDto(1, 1, 100, 10, 5, 4.3m, "Nota privada", DateTime.UtcNow, DateTime.UtcNow);

        tastingService.RecordAsync(1, 10, 5, 4.3m, "Nota privada", null, Arg.Any<CancellationToken>())
            .Returns(new TastingExecutionResult(tastingDto, updatedCellarRow));

        var request = new UncorkCellarItemRequestDto(Rating: 4.3m, Comment: "Nota privada");
        var result = await service.UncorkAsync(1, 5, 10, request);

        Assert.NotNull(result);
        Assert.Equal(1, result.Quantity);
        await tastingService.Received(1).RecordAsync(1, 10, 5, 4.3m, "Nota privada", null, Arg.Any<CancellationToken>());
    }

    // ==========================================
    // 5. Promedio de calificaciones del usuario (B.4)
    // ==========================================
    [Fact]
    public void UserResponseDto_IncludesAverageRating()
    {
        var user = new User
        {
            Id = 1,
            Username = "brian",
            Email = "brian@test.com",
            AverageRating = 4.3m
        };

        var dto = user.ToResponseDto();
        Assert.Equal(4.3m, dto.AverageRating);

        var json = JsonSerializer.Serialize(dto);
        Assert.Contains("\"AverageRating\":4.3", json);
    }

    [Fact]
    public void UserResponseDto_WhenNoReviews_AverageRatingIsNull()
    {
        var user = new User
        {
            Id = 1,
            Username = "nuevo",
            Email = "nuevo@test.com",
            AverageRating = null
        };

        var dto = user.ToResponseDto();
        Assert.Null(dto.AverageRating);

        var json = JsonSerializer.Serialize(dto);
        Assert.Contains("\"AverageRating\":null", json);
    }

    [Fact]
    public void PublicUserProfileDto_IncludesAverageRating()
    {
        var profile = new PublicUserProfileDto(
            1, "sommelier", null, "Bio", DateTime.UtcNow, 5, 10, 3, 4.7m);

        Assert.Equal(4.7m, profile.AverageRating);

        var json = JsonSerializer.Serialize(profile);
        Assert.Contains("\"AverageRating\":4.7", json);
    }
}
