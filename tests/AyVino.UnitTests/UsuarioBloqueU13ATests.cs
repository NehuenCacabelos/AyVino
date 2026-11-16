using System.Text.Json;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.DTOs;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Reviews.DTOs;
using AyVino.Api.Features.Reviews.Models;
using AyVino.Api.Features.Reviews.Repositories;
using AyVino.Api.Features.Reviews.Services;
using AyVino.Api.Features.Reviews.Validation;
using AyVino.Api.Features.UserWines.DTOs;
using AyVino.Api.Features.UserWines.Models;
using AyVino.Api.Features.WineryCatalog.Models;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.UnitTests.Validation;
using NSubstitute;
using Xunit;

namespace AyVino.UnitTests;

public class UsuarioBloqueU13ATests
{
    // ==========================================
    // 1. Validador Único (RatingValidator)
    // ==========================================
    [Theory]
    [InlineData(1.0)]
    [InlineData(4.3)]
    [InlineData(5.0)]
    public void RatingValidator_ValidRatings_PassValidation(double ratingDouble)
    {
        var rating = (decimal)ratingDouble;
        var ex = Record.Exception(() => RatingValidator.Validate(rating));
        Assert.Null(ex);
    }

    [Theory]
    [InlineData(0.9, "El rating debe estar entre 1 y 5.")]
    [InlineData(5.1, "El rating debe estar entre 1 y 5.")]
    [InlineData(-1.0, "El rating debe estar entre 1 y 5.")]
    [InlineData(4.55, "El rating solo puede tener un decimal.")]
    [InlineData(1.05, "El rating solo puede tener un decimal.")]
    public void RatingValidator_InvalidRatings_ThrowValidationException(double ratingDouble, string expectedMessage)
    {
        var rating = (decimal)ratingDouble;
        var ex = Assert.Throws<ValidationException>(() => RatingValidator.Validate(rating));
        Assert.Equal(expectedMessage, ex.Message);
    }

    [Fact]
    public void RatingValidator_Normalize_ReturnsCorrectScale()
    {
        var normalized = RatingValidator.Normalize(4m);
        Assert.Equal(4.0m, normalized);

        var normalizedDecimal = RatingValidator.Normalize(4.3m);
        Assert.Equal(4.3m, normalizedDecimal);
    }

    // ==========================================
    // 2. DataAnnotations en DTOs
    // ==========================================
    [Fact]
    public void CreateReviewRequestDto_WithDecimalRating_ValidatesSuccessfully()
    {
        var dto = new CreateReviewRequestDto(1, 4.3m, "Buen vino");
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Fact]
    public void CreateReviewRequestDto_WithMoreThanOneDecimal_FailsValidation()
    {
        var dto = new CreateReviewRequestDto(1, 4.55m, "Buen vino");
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateReviewRequestDto.Rating)));
        Assert.Contains(results, r => r.ErrorMessage == "El rating solo puede tener un decimal.");
    }

    [Fact]
    public void UpdateReviewRequestDto_WithDecimalRating_ValidatesSuccessfully()
    {
        var dto = new UpdateReviewRequestDto(3.7m, "Actualizado");
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Fact]
    public void UpdateReviewRequestDto_WithOutOfRangeDecimal_FailsValidation()
    {
        var dto = new UpdateReviewRequestDto(0.9m, "Invalido");
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(UpdateReviewRequestDto.Rating)));
    }

    [Fact]
    public void UncorkCellarItemRequestDto_WithDecimalRating_ValidatesSuccessfully()
    {
        var dto = new UncorkCellarItemRequestDto(Rating: 4.8m, Comment: "Cata en cava");
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Fact]
    public void UncorkCellarItemRequestDto_WithInvalidDecimal_FailsValidation()
    {
        var dto = new UncorkCellarItemRequestDto(Rating: 5.1m, Comment: "Cata en cava");
        var results = ValidationTestHelper.Validate(dto);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(UncorkCellarItemRequestDto.Rating)));
    }

    // ==========================================
    // 3. Modelos C# soportan decimal en Rating / RatingSum
    // ==========================================
    [Fact]
    public void Models_SupportDecimalRatingAndRatingSum()
    {
        var review = new Review { Id = 1, Rating = 4.3m };
        Assert.Equal(4.3m, review.Rating);

        var wine = new Wine { Id = 1, RatingSum = 21.5m, ReviewCount = 5 };
        Assert.Equal(21.5m, wine.RatingSum);

        var vintage = new WineVintage { Id = 1, RatingSum = 18.7m, ReviewCount = 5 };
        Assert.Equal(18.7m, vintage.RatingSum);

        var cellarRow = new CellarItemListRow { WineVintageId = 1, RatingSum = 21.5m, ReviewCount = 5 };
        Assert.Equal(21.5m, cellarRow.RatingSum);

        var userWineRow = new UserWineListRow { WineId = 1, RatingSum = 21.5m, UserRating = 4.3m };
        Assert.Equal(21.5m, userWineRow.RatingSum);
        Assert.Equal(4.3m, userWineRow.UserRating);

        var wineryWineRow = new WineryCatalogWineRow { Id = 1, RatingSum = 45.2m };
        Assert.Equal(45.2m, wineryWineRow.RatingSum);

        var wineryVintageRow = new WineryCatalogVintageRow { Id = 1, RatingSum = 22.6m };
        Assert.Equal(22.6m, wineryVintageRow.RatingSum);

        var wineryTotalsRow = new WineryPublicRatingsAndTotalsRow { RatingSum = 67.8m };
        Assert.Equal(67.8m, wineryTotalsRow.RatingSum);
    }

    // ==========================================
    // 4. Promedio y RatingSum con decimales + JSON Formatting
    // ==========================================
    [Fact]
    public void WineMappingExtensions_CalculatesAverageRating_WithOneDecimal()
    {
        var wine = new Wine
        {
            Id = 1,
            Name = "Vino Test",
            WineType = WineType.Red,
            RatingSum = 21.5m,
            ReviewCount = 5
        };

        var dto = wine.ToResponseDto();
        Assert.Equal(4.3m, dto.AverageRating); // 21.5 / 5 = 4.3
    }

    [Fact]
    public void WineVintageMappingExtensions_CalculatesAverageRating_WithOneDecimal()
    {
        var vintage = new WineVintage
        {
            Id = 1,
            WineId = 1,
            RatingSum = 18.7m,
            ReviewCount = 5
        };

        var dto = vintage.ToResponseDto(Array.Empty<WineGrape>());
        Assert.Equal(3.7m, dto.AverageRating); // 18.7 / 5 = 3.74 -> 3.7
    }

    [Fact]
    public void JsonSerialization_OutputsRatingAndAverage_WithOneDecimal()
    {
        var reviewDto = new ReviewResponseDto(
            1, 1, "testuser", 10, 2021, 4.0m, "Buen vino", DateTime.UtcNow, null);

        var json = JsonSerializer.Serialize(reviewDto);
        Assert.Contains("\"Rating\":4.0", json);

        var wineDto = new WineResponseDto(
            1, null, null, "Malbec", null, "Red", null, "Official", null, 4.3m, 5);

        var wineJson = JsonSerializer.Serialize(wineDto);
        Assert.Contains("\"AverageRating\":4.3", wineJson);
    }

    // ==========================================
    // 5. ReviewService con calificaciones decimales
    // ==========================================
    [Fact]
    public async Task ReviewService_CreateAsync_AcceptsDecimalRating()
    {
        var reviewRepo = Substitute.For<IReviewRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var service = new ReviewService(reviewRepo, vintageRepo);

        vintageRepo.ExistsByIdAsync(10).Returns(true);
        reviewRepo.ExistsForUserAndVintageAsync(1, 10).Returns(false);
        reviewRepo.CreateAsync(Arg.Any<Review>()).Returns(99);
        reviewRepo.GetResponseByIdAsync(99).Returns(new ReviewResponseDto(
            99, 1, "usuario", 10, 2022, 4.3m, "Comentario", DateTime.UtcNow, null));

        var request = new CreateReviewRequestDto(10, 4.3m, "Comentario");
        var result = await service.CreateAsync(request, 1);

        Assert.Equal(4.3m, result.Rating);
        await reviewRepo.Received(1).CreateAsync(Arg.Is<Review>(r => r.Rating == 4.3m));
    }

    [Fact]
    public async Task ReviewService_UpdateAsync_AcceptsDecimalRating()
    {
        var reviewRepo = Substitute.For<IReviewRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var service = new ReviewService(reviewRepo, vintageRepo);

        var existing = new Review { Id = 99, UserId = 1, WineVintageId = 10, Rating = 4.0m, Comment = "Viejo" };
        reviewRepo.GetByIdAsync(99).Returns(existing);
        reviewRepo.UpdateAsync(Arg.Any<Review>()).Returns(true);
        reviewRepo.GetResponseByIdAsync(99).Returns(new ReviewResponseDto(
            99, 1, "usuario", 10, 2022, 3.7m, "Actualizado", DateTime.UtcNow, DateTime.UtcNow));

        var request = new UpdateReviewRequestDto(3.7m, "Actualizado");
        var result = await service.UpdateAsync(99, request, 1);

        Assert.Equal(3.7m, result.Rating);
        await reviewRepo.Received(1).UpdateAsync(Arg.Is<Review>(r => r.Rating == 3.7m));
    }

    [Fact]
    public async Task ReviewService_CreateAsync_WithInvalidDecimal_ThrowsValidationException()
    {
        var reviewRepo = Substitute.For<IReviewRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var service = new ReviewService(reviewRepo, vintageRepo);

        var request = new CreateReviewRequestDto(10, 4.55m, "Comentario");

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(request, 1));
        Assert.Equal("El rating solo puede tener un decimal.", ex.Message);
        await reviewRepo.DidNotReceive().CreateAsync(Arg.Any<Review>());
    }

    [Fact]
    public async Task ReviewService_GetPagedForAdminAsync_PassesDecimalRating()
    {
        var reviewRepo = Substitute.For<IReviewRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var service = new ReviewService(reviewRepo, vintageRepo);

        reviewRepo.GetPagedForAdminAsync(1, 10, rating: 4.3m).Returns(Array.Empty<AdminReviewListItemDto>());

        var result = await service.GetPagedForAdminAsync(1, 10, rating: 4.3m);

        Assert.NotNull(result);
        await reviewRepo.Received(1).GetPagedForAdminAsync(1, 10, rating: 4.3m);
    }

    [Fact]
    public void ReviewResponseDto_HasParameterlessConstructor_ForDapperMaterialization()
    {
        var dto = new ReviewResponseDto();
        Assert.NotNull(dto);
        Assert.Equal(0, dto.Id);
        Assert.Equal(0m, dto.Rating);

        var paramDto = new ReviewResponseDto(1, 2, "TestUser", 3, 2020, 4.3m, "Excelente", DateTime.UtcNow, null);
        Assert.Equal(4.3m, paramDto.Rating);
        Assert.Equal("TestUser", paramDto.UserName);
    }
}
