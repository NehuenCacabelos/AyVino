using System.Data;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Cellars.Models;
using AyVino.Api.Features.Cellars.Repositories;
using AyVino.Api.Features.Reviews.DTOs;
using AyVino.Api.Features.Uncorks.DTOs;
using AyVino.Api.Features.Uncorks.Repositories;
using AyVino.Api.Features.Uncorks.Services;
using AyVino.Api.Features.Users.DTOs;
using AyVino.Api.Features.Users.Models;
using AyVino.Api.Features.UserWines.Models;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.WineryCatalog.Models;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Repositories;
using Dapper;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Xunit;

namespace AyVino.UnitTests;

public class UsuarioBloqueU14ATests
{
    static UsuarioBloqueU14ATests()
    {
        DefaultTypeMap.MatchNamesWithUnderscores = true;
    }

    // =========================================================================
    // A.5 Tests de materialización Dapper SIN base de datos (in-memory DataReader)
    // =========================================================================

    [Fact]
    public void Dapper_Materialize_ReviewResponseDto_Succeeds()
    {
        using var table = new DataTable();
        table.Columns.Add("id", typeof(int));
        table.Columns.Add("user_id", typeof(int));
        table.Columns.Add("username", typeof(string));
        table.Columns.Add("wine_vintage_id", typeof(int));
        table.Columns.Add("vintage_year", typeof(int));
        table.Columns.Add("rating", typeof(decimal)); // Npgsql maps numeric(2,1) -> decimal
        table.Columns.Add("comment", typeof(string));
        table.Columns.Add("created_at", typeof(DateTime));
        table.Columns.Add("updated_at", typeof(DateTime));

        table.Rows.Add(1, 10, "kevin", 22, 2020, 4.3m, "Excelente vino", DateTime.UtcNow, null);

        using var reader = table.CreateDataReader();
        var items = reader.Parse<ReviewResponseDto>().ToList();

        Assert.Single(items);
        var item = items[0];
        Assert.Equal(1, item.Id);
        Assert.Equal(10, item.UserId);
        Assert.Equal("kevin", item.UserName);
        Assert.Equal(22, item.WineVintageId);
        Assert.Equal(2020, item.VintageYear);
        Assert.Equal(4.3m, item.Rating);
        Assert.Equal("Excelente vino", item.Comment);
        Assert.Null(item.UpdatedAt);
    }

    [Fact]
    public void Dapper_Materialize_AdminReviewListItemDto_Succeeds()
    {
        using var table = new DataTable();
        table.Columns.Add("id", typeof(int));
        table.Columns.Add("rating", typeof(decimal));
        table.Columns.Add("comment", typeof(string));
        table.Columns.Add("created_at", typeof(DateTime));
        table.Columns.Add("user_id", typeof(int));
        table.Columns.Add("username", typeof(string));
        table.Columns.Add("wine_vintage_id", typeof(int));
        table.Columns.Add("wine_id", typeof(int));
        table.Columns.Add("wine_name", typeof(string));
        table.Columns.Add("year", typeof(int));

        table.Rows.Add(5, 4.8m, "Gran etiqueta", DateTime.UtcNow, 12, "sommelier", 30, 15, "Catena Zapata", 2018);

        using var reader = table.CreateDataReader();
        var items = reader.Parse<AdminReviewListItemDto>().ToList();

        Assert.Single(items);
        var item = items[0];
        Assert.Equal(5, item.Id);
        Assert.Equal(4.8m, item.Rating);
        Assert.Equal("Catena Zapata", item.WineName);
        Assert.Equal(2018, item.Year);
    }

    [Fact]
    public void Dapper_Materialize_CellarItemListRow_Succeeds()
    {
        using var table = new DataTable();
        table.Columns.Add("wine_vintage_id", typeof(int));
        table.Columns.Add("wine_id", typeof(int));
        table.Columns.Add("name", typeof(string));
        table.Columns.Add("wine_type", typeof(int));
        table.Columns.Add("winery_id", typeof(int));
        table.Columns.Add("winery_name_text", typeof(string));
        table.Columns.Add("winery_name", typeof(string));
        table.Columns.Add("region_name", typeof(string));
        table.Columns.Add("grape_name", typeof(string));
        table.Columns.Add("year", typeof(int));
        table.Columns.Add("image_id", typeof(Guid));
        table.Columns.Add("rating_sum", typeof(decimal)); // numeric(12,1)
        table.Columns.Add("review_count", typeof(int));
        table.Columns.Add("quantity", typeof(int));
        table.Columns.Add("purchase_date", typeof(DateOnly));
        table.Columns.Add("notes", typeof(string));
        table.Columns.Add("last_change_at", typeof(DateTime));

        table.Rows.Add(10, 100, "Cobos Bramare", (int)WineType.Red, 1, null, "Viña Cobos", "Mendoza", "Malbec", 2021, Guid.NewGuid(), 8.6m, 2, 3, DateOnly.FromDateTime(DateTime.UtcNow), "Guardar 3 años", DateTime.UtcNow);

        using var reader = table.CreateDataReader();
        var items = reader.Parse<CellarItemListRow>().ToList();

        Assert.Single(items);
        var item = items[0];
        Assert.Equal("Cobos Bramare", item.Name);
        Assert.Equal(8.6m, item.RatingSum);
        Assert.Equal(2, item.ReviewCount);
        Assert.Equal(3, item.Quantity);
    }

    [Fact]
    public void Dapper_Materialize_UserWineListRow_Succeeds()
    {
        using var table = new DataTable();
        table.Columns.Add("wine_id", typeof(int));
        table.Columns.Add("name", typeof(string));
        table.Columns.Add("wine_type", typeof(int));
        table.Columns.Add("winery_id", typeof(int));
        table.Columns.Add("winery_name_text", typeof(string));
        table.Columns.Add("winery_name", typeof(string));
        table.Columns.Add("vintage", typeof(int));
        table.Columns.Add("image_url", typeof(string));
        table.Columns.Add("rating_sum", typeof(decimal));
        table.Columns.Add("review_count", typeof(int));
        table.Columns.Add("is_wanted", typeof(bool));
        table.Columns.Add("is_tried", typeof(bool));
        table.Columns.Add("is_favorite", typeof(bool));
        table.Columns.Add("last_change_at", typeof(DateTime));
        table.Columns.Add("user_rating", typeof(decimal));
        table.Columns.Add("user_comment", typeof(string));

        table.Rows.Add(100, "DV Catena", (int)WineType.Red, 2, null, "Catena", 2020, "/api/images/1", 12.9m, 3, false, true, true, DateTime.UtcNow, 4.3m, "Excelente");

        using var reader = table.CreateDataReader();
        var items = reader.Parse<UserWineListRow>().ToList();

        Assert.Single(items);
        var item = items[0];
        Assert.Equal(100, item.WineId);
        Assert.Equal(12.9m, item.RatingSum);
        Assert.Equal(4.3m, item.UserRating);
        Assert.Equal("Excelente", item.UserComment);
    }

    [Fact]
    public void Dapper_Materialize_CatalogWineItemDto_Succeeds()
    {
        using var table = new DataTable();
        table.Columns.Add("id", typeof(int));
        table.Columns.Add("winery_id", typeof(int));
        table.Columns.Add("winery_name_text", typeof(string));
        table.Columns.Add("winery_name", typeof(string));
        table.Columns.Add("name", typeof(string));
        table.Columns.Add("description", typeof(string));
        table.Columns.Add("wine_type", typeof(string));
        table.Columns.Add("location_id", typeof(int));
        table.Columns.Add("region_name", typeof(string));
        table.Columns.Add("varietal", typeof(string));
        table.Columns.Add("vintage", typeof(int));
        table.Columns.Add("image_id", typeof(Guid));
        table.Columns.Add("image_url", typeof(string));
        table.Columns.Add("source_type", typeof(string));
        table.Columns.Add("duplicate_of_wine_id", typeof(int));
        table.Columns.Add("average_rating", typeof(decimal));
        table.Columns.Add("review_count", typeof(int));
        table.Columns.Add("winery_logo_image_id", typeof(Guid));

        table.Rows.Add(1, 1, null, "Zuccardi", "Concreto", "Sin madera", "Red", 5, "Valle de Uco", "Malbec", 2021, DBNull.Value, null, "Official", DBNull.Value, 4.5m, 12, DBNull.Value);

        using var reader = table.CreateDataReader();
        var items = reader.Parse<CatalogWineItemDto>().ToList();

        Assert.Single(items);
        var item = items[0];
        Assert.Equal("Concreto", item.Name);
        Assert.Equal(4.5m, item.AverageRating);
        Assert.Equal(12, item.ReviewCount);
    }

    [Fact]
    public void Dapper_Materialize_WineryCatalogRows_Succeeds()
    {
        // 1. WineryCatalogWineRow
        using var tableWines = new DataTable();
        tableWines.Columns.Add("id", typeof(int));
        tableWines.Columns.Add("name", typeof(string));
        tableWines.Columns.Add("description", typeof(string));
        tableWines.Columns.Add("wine_type", typeof(int));
        tableWines.Columns.Add("source_type", typeof(int));
        tableWines.Columns.Add("rating_sum", typeof(decimal));
        tableWines.Columns.Add("review_count", typeof(int));
        tableWines.Rows.Add(10, "Gran Reserva", "Madera", (int)WineType.Red, (int)SourceType.Official, 18.5m, 4);

        using var readerWines = tableWines.CreateDataReader();
        var wineRows = readerWines.Parse<WineryCatalogWineRow>().ToList();
        Assert.Single(wineRows);
        Assert.Equal(18.5m, wineRows[0].RatingSum);
        Assert.Equal(4, wineRows[0].ReviewCount);

        // 2. WineryCatalogVintageRow
        using var tableVintages = new DataTable();
        tableVintages.Columns.Add("id", typeof(int));
        tableVintages.Columns.Add("wine_id", typeof(int));
        tableVintages.Columns.Add("year", typeof(int));
        tableVintages.Columns.Add("alcohol_content", typeof(decimal));
        tableVintages.Columns.Add("serving_temperature", typeof(int));
        tableVintages.Columns.Add("aging_advice", typeof(string));
        tableVintages.Columns.Add("image_id", typeof(Guid));
        tableVintages.Columns.Add("approval_status", typeof(int));
        tableVintages.Columns.Add("register_date", typeof(DateTime));
        tableVintages.Columns.Add("rating_sum", typeof(decimal));
        tableVintages.Columns.Add("review_count", typeof(int));
        tableVintages.Rows.Add(1, 10, 2020, 14.2m, 16, "5 años", DBNull.Value, (int)ApprovalStatus.Approved, DateTime.UtcNow, 8.8m, 2);

        using var readerVintages = tableVintages.CreateDataReader();
        var vintageRows = readerVintages.Parse<WineryCatalogVintageRow>().ToList();
        Assert.Single(vintageRows);
        Assert.Equal(8.8m, vintageRows[0].RatingSum);

        // 3. WineryPublicRatingsAndTotalsRow
        using var tableTotals = new DataTable();
        tableTotals.Columns.Add("labels", typeof(int));
        tableTotals.Columns.Add("vintages", typeof(int));
        tableTotals.Columns.Add("rating_sum", typeof(decimal));
        tableTotals.Columns.Add("review_count", typeof(int));
        tableTotals.Rows.Add(5, 12, 45.5m, 10);

        using var readerTotals = tableTotals.CreateDataReader();
        var totalRows = readerTotals.Parse<WineryPublicRatingsAndTotalsRow>().ToList();
        Assert.Single(totalRows);
        Assert.Equal(45.5m, totalRows[0].RatingSum);
        Assert.Equal(10, totalRows[0].ReviewCount);
    }

    [Fact]
    public void Dapper_Materialize_UncorkListItemDto_Succeeds()
    {
        using var table = new DataTable();
        table.Columns.Add("id", typeof(int));
        table.Columns.Add("wine_id", typeof(int));
        table.Columns.Add("wine_vintage_id", typeof(int));
        table.Columns.Add("wine_name", typeof(string));
        table.Columns.Add("winery_name", typeof(string));
        table.Columns.Add("year", typeof(int));
        table.Columns.Add("image_id", typeof(Guid));
        table.Columns.Add("cellar_name", typeof(string));
        table.Columns.Add("uncorked_at", typeof(DateTime));
        table.Columns.Add("rating", typeof(decimal)); // LEFT JOIN reviews r ON ...
        table.Columns.Add("comment", typeof(string));

        table.Rows.Add(1, 100, 10, "Malbec Reserva", "Catena", 2020, Guid.NewGuid(), "Cava Principal", DateTime.UtcNow, 4.4m, "Muy buen final");

        using var reader = table.CreateDataReader();
        var items = reader.Parse<UncorkListItemDto>().ToList();

        Assert.Single(items);
        var item = items[0];
        Assert.Equal(1, item.Id);
        Assert.Equal(100, item.WineId);
        Assert.Equal(10, item.WineVintageId);
        Assert.Equal("Malbec Reserva", item.WineName);
        Assert.Equal("Catena", item.WineryName);
        Assert.Equal(2020, item.Year);
        Assert.Equal("Cava Principal", item.CellarName);
        Assert.Equal(4.4m, item.Rating);
        Assert.Equal("Muy buen final", item.Comment);
    }

    [Fact]
    public void Dapper_Materialize_User_AverageRating_Succeeds()
    {
        using var table = new DataTable();
        table.Columns.Add("id", typeof(int));
        table.Columns.Add("username", typeof(string));
        table.Columns.Add("email", typeof(string));
        table.Columns.Add("password_hash", typeof(string));
        table.Columns.Add("role", typeof(string));
        table.Columns.Add("is_active", typeof(bool));
        table.Columns.Add("created_at", typeof(DateTime));
        table.Columns.Add("average_rating", typeof(decimal)); // ROUND(AVG(r.rating), 1) -> numeric

        table.Rows.Add(1, "brian", "brian@test.com", "hash", "User", true, DateTime.UtcNow, 4.3m);

        using var reader = table.CreateDataReader();
        var users = reader.Parse<User>().ToList();

        Assert.Single(users);
        Assert.Equal(4.3m, users[0].AverageRating);
    }

    [Fact]
    public void Dapper_Materialize_PublicUserProfileDto_Succeeds()
    {
        using var table = new DataTable();
        table.Columns.Add("id", typeof(int));
        table.Columns.Add("username", typeof(string));
        table.Columns.Add("avatar_image_id", typeof(Guid));
        table.Columns.Add("bio", typeof(string));
        table.Columns.Add("register_date", typeof(DateTime));
        table.Columns.Add("cellar_wines_count", typeof(int));
        table.Columns.Add("followers_count", typeof(int));
        table.Columns.Add("following_count", typeof(int));
        table.Columns.Add("average_rating", typeof(decimal));

        var avatarId = Guid.NewGuid();
        table.Rows.Add(1, "usuario", avatarId, "Sommelier aficionado", DateTime.UtcNow, 5, 12, 8, 4.6m);

        using var reader = table.CreateDataReader();
        var items = reader.Parse<PublicUserProfileDto>().ToList();

        Assert.Single(items);
        var item = items[0];
        Assert.Equal(1, item.Id);
        Assert.Equal("usuario", item.Username);
        Assert.Equal(avatarId, item.AvatarImageId);
        Assert.Equal("Sommelier aficionado", item.Bio);
        Assert.Equal(5, item.CellarWinesCount);
        Assert.Equal(12, item.FollowersCount);
        Assert.Equal(8, item.FollowingCount);
        Assert.Equal(4.6m, item.AverageRating);
    }

    // =========================================================================
    // A.6 Tests funcionales de UncorkService (xUnit)
    // =========================================================================

    [Fact]
    public async Task UncorkService_WithRating_CreatesReviewAndReturnsUncork()
    {
        var uncorkRepo = Substitute.For<IUncorkRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new UncorkService(uncorkRepo, vintageRepo, cellarRepo);

        vintageRepo.ExistsByIdAsync(22).Returns(true);

        var expectedResponse = new UncorkResponseDto(1, 10, 100, 22, null, 4.5m, "Excelente cosecha", DateTime.UtcNow, DateTime.UtcNow);
        uncorkRepo.RecordUncorkInTransactionAsync(10, 22, null, 4.5m, "Excelente cosecha", Arg.Any<DateTime>())
            .Returns(new UncorkExecutionResult(expectedResponse, null));

        var req = new CreateUncorkRequestDto(22, 4.5m, "Excelente cosecha", null);
        var result = await service.CreateAsync(10, req);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal(4.5m, result.Rating);
        Assert.Equal("Excelente cosecha", result.Comment);
        await uncorkRepo.Received(1).RecordUncorkInTransactionAsync(10, 22, null, 4.5m, "Excelente cosecha", Arg.Any<DateTime>());
    }

    [Fact]
    public async Task UncorkService_WithoutRating_RegistersEventWithoutTouchingReview()
    {
        var uncorkRepo = Substitute.For<IUncorkRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new UncorkService(uncorkRepo, vintageRepo, cellarRepo);

        vintageRepo.ExistsByIdAsync(22).Returns(true);

        var expectedResponse = new UncorkResponseDto(2, 10, 100, 22, null, null, null, DateTime.UtcNow, DateTime.UtcNow);
        uncorkRepo.RecordUncorkInTransactionAsync(10, 22, null, null, null, Arg.Any<DateTime>())
            .Returns(new UncorkExecutionResult(expectedResponse, null));

        var req = new CreateUncorkRequestDto(22, null, null, null);
        var result = await service.CreateAsync(10, req);

        Assert.NotNull(result);
        Assert.Equal(2, result.Id);
        Assert.Null(result.Rating);
        Assert.Null(result.Comment);
        await uncorkRepo.Received(1).RecordUncorkInTransactionAsync(10, 22, null, null, null, Arg.Any<DateTime>());
    }

    [Fact]
    public async Task UncorkService_CommentWithoutRating_ThrowsValidationException_WithoutSideEffects()
    {
        var uncorkRepo = Substitute.For<IUncorkRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new UncorkService(uncorkRepo, vintageRepo, cellarRepo);

        var req = new CreateUncorkRequestDto(22, null, "Comentario solo", null);
        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(10, req));

        Assert.Equal("El comentario requiere una calificación.", ex.Message);
        await uncorkRepo.DidNotReceive().RecordUncorkInTransactionAsync(
            Arg.Any<int>(), Arg.Any<int>(), Arg.Any<int?>(), Arg.Any<decimal?>(), Arg.Any<string?>(), Arg.Any<DateTime>());
    }

    [Theory]
    [InlineData(0.9)]
    [InlineData(5.1)]
    [InlineData(4.55)]
    public async Task UncorkService_InvalidRating_ThrowsValidationException(decimal invalidRating)
    {
        var uncorkRepo = Substitute.For<IUncorkRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new UncorkService(uncorkRepo, vintageRepo, cellarRepo);

        var req = new CreateUncorkRequestDto(22, invalidRating, "Nota", null);
        await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(10, req));

        await uncorkRepo.DidNotReceive().RecordUncorkInTransactionAsync(
            Arg.Any<int>(), Arg.Any<int>(), Arg.Any<int?>(), Arg.Any<decimal?>(), Arg.Any<string?>(), Arg.Any<DateTime>());
    }

    [Fact]
    public async Task UncorkService_CellarOutOfStock_ThrowsConflictException()
    {
        var uncorkRepo = Substitute.For<IUncorkRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new UncorkService(uncorkRepo, vintageRepo, cellarRepo);

        vintageRepo.ExistsByIdAsync(22).Returns(true);
        cellarRepo.GetByIdAsync(5, 10).Returns(new Cellar { Id = 5, UserId = 10, Name = "Cava" });

        uncorkRepo.RecordUncorkInTransactionAsync(10, 22, 5, 4.0m, null, Arg.Any<DateTime>())
            .ThrowsAsync(new ConflictException("No quedan botellas de esta cosecha en la cava o el ítem no existe."));

        var ex = await Assert.ThrowsAsync<ConflictException>(() =>
            service.RecordAsync(10, 22, 5, 4.0m, null, null));

        Assert.Equal("No quedan botellas de esta cosecha en la cava o el ítem no existe.", ex.Message);
    }

    [Fact]
    public async Task UncorkService_ForeignCellar_ThrowsNotFoundException()
    {
        var uncorkRepo = Substitute.For<IUncorkRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new UncorkService(uncorkRepo, vintageRepo, cellarRepo);

        vintageRepo.ExistsByIdAsync(22).Returns(true);
        cellarRepo.GetByIdAsync(99, 10).Returns((Cellar?)null);

        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            service.RecordAsync(10, 22, 99, 4.0m, null, null));

        Assert.Equal("Cava con ID 99 no encontrada.", ex.Message);
        await uncorkRepo.DidNotReceive().RecordUncorkInTransactionAsync(
            Arg.Any<int>(), Arg.Any<int>(), Arg.Any<int?>(), Arg.Any<decimal?>(), Arg.Any<string?>(), Arg.Any<DateTime>());
    }

    [Fact]
    public async Task UncorkService_GetPagedByUserIdAsync_ReturnsOnlyUserUncorksWithReviewData()
    {
        var uncorkRepo = Substitute.For<IUncorkRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new UncorkService(uncorkRepo, vintageRepo, cellarRepo);

        var uncorkList = new List<UncorkListItemDto>
        {
            new(10, 100, 22, "Gran Enemigo", "Aleanna", 2019, null, "Cava Casa", DateTime.UtcNow, 4.9m, "Insuperable"),
            new(9, 100, 22, "Gran Enemigo", "Aleanna", 2019, null, "Cava Casa", DateTime.UtcNow.AddDays(-10), 4.9m, "Insuperable")
        };

        uncorkRepo.GetPagedByUserIdAsync(10, 1, 20, 22).Returns(uncorkList);

        var result = (await service.GetPagedByUserIdAsync(10, 1, 20, 22)).ToList();

        Assert.Equal(2, result.Count);
        Assert.Equal(10, result[0].Id);
        Assert.Equal(9, result[1].Id);
        Assert.Equal("Gran Enemigo", result[0].WineName);
        Assert.Equal(4.9m, result[0].Rating);
        Assert.Equal("Insuperable", result[0].Comment);
    }

    [Fact]
    public async Task UncorkService_TwoUncorksSameWine_CreatesTwoEvents()
    {
        var uncorkRepo = Substitute.For<IUncorkRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var cellarRepo = Substitute.For<ICellarRepository>();
        var service = new UncorkService(uncorkRepo, vintageRepo, cellarRepo);

        vintageRepo.ExistsByIdAsync(22).Returns(true);

        var firstResult = new UncorkResponseDto(101, 10, 50, 22, null, 4.0m, "Primera", DateTime.UtcNow.AddDays(-1), DateTime.UtcNow);
        var secondResult = new UncorkResponseDto(102, 10, 50, 22, null, 4.5m, "Segunda", DateTime.UtcNow, DateTime.UtcNow);

        uncorkRepo.RecordUncorkInTransactionAsync(10, 22, null, 4.0m, "Primera", Arg.Any<DateTime>())
            .Returns(new UncorkExecutionResult(firstResult, null));
        uncorkRepo.RecordUncorkInTransactionAsync(10, 22, null, 4.5m, "Segunda", Arg.Any<DateTime>())
            .Returns(new UncorkExecutionResult(secondResult, null));

        var res1 = await service.CreateAsync(10, new CreateUncorkRequestDto(22, 4.0m, "Primera"));
        var res2 = await service.CreateAsync(10, new CreateUncorkRequestDto(22, 4.5m, "Segunda"));

        Assert.Equal(101, res1.Id);
        Assert.Equal(102, res2.Id);
        Assert.NotEqual(res1.Id, res2.Id);
        await uncorkRepo.Received(2).RecordUncorkInTransactionAsync(10, 22, null, Arg.Any<decimal?>(), Arg.Any<string?>(), Arg.Any<DateTime>());
    }

    [Fact]
    public async Task ReviewService_GetByVintageAndUserAsync_ReturnsReview_WhenFound()
    {
        var reviewRepo = Substitute.For<AyVino.Api.Features.Reviews.Repositories.IReviewRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var service = new AyVino.Api.Features.Reviews.Services.ReviewService(reviewRepo, vintageRepo);

        var expectedDto = new ReviewResponseDto(1, 10, "kevin", 22, 2020, 4.5m, "Gran vino", DateTime.UtcNow, null);
        reviewRepo.GetByVintageAndUserAsync(22, 10).Returns(expectedDto);

        var result = await service.GetByVintageAndUserAsync(22, 10);

        Assert.NotNull(result);
        Assert.Equal(4.5m, result.Rating);
        Assert.Equal("Gran vino", result.Comment);
    }

    [Fact]
    public async Task ReviewService_GetByVintageAndUserAsync_ReturnsNull_WhenNotFound()
    {
        var reviewRepo = Substitute.For<AyVino.Api.Features.Reviews.Repositories.IReviewRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var service = new AyVino.Api.Features.Reviews.Services.ReviewService(reviewRepo, vintageRepo);

        reviewRepo.GetByVintageAndUserAsync(22, 10).Returns((ReviewResponseDto?)null);

        var result = await service.GetByVintageAndUserAsync(22, 10);

        Assert.Null(result);
    }

    [Fact]
    public async Task ReviewService_GetByVintageAndUserAsync_InvalidId_ThrowsValidationException()
    {
        var reviewRepo = Substitute.For<AyVino.Api.Features.Reviews.Repositories.IReviewRepository>();
        var vintageRepo = Substitute.For<IWineVintageRepository>();
        var service = new AyVino.Api.Features.Reviews.Services.ReviewService(reviewRepo, vintageRepo);

        await Assert.ThrowsAsync<ValidationException>(() => service.GetByVintageAndUserAsync(0, 10));
    }
}
