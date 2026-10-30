using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Audit.Enums;
using AyVino.Api.Features.Audit.Services;
using AyVino.Api.Features.Reviews.DTOs;
using AyVino.Api.Features.Reviews.Models;
using AyVino.Api.Features.Reviews.Repositories;
using AyVino.Api.Features.Reviews.Services;
using AyVino.Api.Features.Wines.Repositories;
using NSubstitute;

namespace AyVino.UnitTests;

public class AdminReviewModerationTests
{
    private readonly IReviewRepository _reviewRepo = Substitute.For<IReviewRepository>();
    private readonly IWineVintageRepository _vintageRepo = Substitute.For<IWineVintageRepository>();
    private readonly IAuditService _auditService = Substitute.For<IAuditService>();
    private readonly ReviewService _service;

    public AdminReviewModerationTests()
    {
        _service = new ReviewService(_reviewRepo, _vintageRepo, _auditService);
    }

    [Fact]
    public async Task Author_Can_Delete_Own_Review_Without_Audit()
    {
        var review = new Review
        {
            Id = 10,
            UserId = 42,
            WineVintageId = 5,
            Rating = 4,
            Comment = "Muy bueno",
            CreatedAt = DateTime.UtcNow
        };
        _reviewRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(review);
        _reviewRepo.DeleteAsync(10, Arg.Any<CancellationToken>()).Returns(true);

        var actor = new Actor(42, AppRoles.User, "author_user");
        await _service.DeleteAsync(10, actor);

        await _reviewRepo.Received(1).DeleteAsync(10, Arg.Any<CancellationToken>());
        await _auditService.DidNotReceiveWithAnyArgs().RecordAsync(default, default!, default, default!, default, default);
    }

    [Fact]
    public async Task Admin_Can_Delete_Other_User_Review_And_Audit_Is_Recorded()
    {
        var review = new Review
        {
            Id = 15,
            UserId = 42,
            WineVintageId = 5,
            Rating = 5,
            Comment = "Excelente vino",
            CreatedAt = DateTime.UtcNow
        };
        _reviewRepo.GetByIdAsync(15, Arg.Any<CancellationToken>()).Returns(review);
        _reviewRepo.DeleteAsync(15, Arg.Any<CancellationToken>()).Returns(true);

        var adminActor = new Actor(1, AppRoles.Admin, "super_admin");
        await _service.DeleteAsync(15, adminActor);

        await _reviewRepo.Received(1).DeleteAsync(15, Arg.Any<CancellationToken>());
        await _auditService.Received(1).RecordAsync(
            1,
            "super_admin",
            AuditAction.ReviewDeletedByAdmin,
            "Review",
            15,
            Arg.Is<string>(d => d.Contains("42") && d.Contains("5")),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Admin_Deleting_Own_Review_Does_Not_Record_ReviewDeletedByAdmin_Audit()
    {
        var review = new Review
        {
            Id = 20,
            UserId = 1,
            WineVintageId = 5,
            Rating = 3,
            Comment = "Regular",
            CreatedAt = DateTime.UtcNow
        };
        _reviewRepo.GetByIdAsync(20, Arg.Any<CancellationToken>()).Returns(review);
        _reviewRepo.DeleteAsync(20, Arg.Any<CancellationToken>()).Returns(true);

        var adminActor = new Actor(1, AppRoles.Admin, "super_admin");
        await _service.DeleteAsync(20, adminActor);

        await _reviewRepo.Received(1).DeleteAsync(20, Arg.Any<CancellationToken>());
        await _auditService.DidNotReceiveWithAnyArgs().RecordAsync(default, default!, default, default!, default, default);
    }

    [Fact]
    public async Task NonAdmin_Cannot_Delete_Other_User_Review_ThrowsForbiddenException()
    {
        var review = new Review
        {
            Id = 10,
            UserId = 42,
            WineVintageId = 5,
            Rating = 4,
            Comment = "Muy bueno",
            CreatedAt = DateTime.UtcNow
        };
        _reviewRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(review);

        var intruder = new Actor(99, AppRoles.User, "other_user");
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() => _service.DeleteAsync(10, intruder));
        Assert.Contains("otro usuario", ex.Message);
        await _reviewRepo.DidNotReceiveWithAnyArgs().DeleteAsync(default);
    }

    [Fact]
    public async Task DeleteAsync_ThrowsNotFoundException_WhenReviewDoesNotExist()
    {
        _reviewRepo.GetByIdAsync(999, Arg.Any<CancellationToken>()).Returns((Review?)null);

        var adminActor = new Actor(1, AppRoles.Admin, "admin");
        await Assert.ThrowsAsync<NotFoundException>(() => _service.DeleteAsync(999, adminActor));
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(-1, 10)]
    public async Task GetPagedForAdmin_ThrowsValidationException_WhenPageNumberInvalid(int pageNumber, int pageSize)
    {
        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.GetPagedForAdminAsync(pageNumber, pageSize));
    }

    [Theory]
    [InlineData(1, 0)]
    [InlineData(1, 101)]
    public async Task GetPagedForAdmin_ThrowsValidationException_WhenPageSizeInvalid(int pageNumber, int pageSize)
    {
        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.GetPagedForAdminAsync(pageNumber, pageSize));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public async Task GetPagedForAdmin_ThrowsValidationException_WhenRatingInvalid(int rating)
    {
        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.GetPagedForAdminAsync(1, 10, rating: rating));
    }

    [Fact]
    public async Task GetPagedForAdmin_ReturnsRows_WhenValid()
    {
        var list = new List<AdminReviewListItemDto>
        {
            new(1, 5, "Buen vino", DateTime.UtcNow, 42, "juan", 10, 20, "Malbec Gran Reserva", 2020)
        };
        _reviewRepo.GetPagedForAdminAsync(1, 10, 20, 10, 42, 5, Arg.Any<CancellationToken>()).Returns(list);

        var result = await _service.GetPagedForAdminAsync(1, 10, 20, 10, 42, 5);

        Assert.Single(result);
        Assert.Equal("Malbec Gran Reserva", result.First().WineName);
    }
}
