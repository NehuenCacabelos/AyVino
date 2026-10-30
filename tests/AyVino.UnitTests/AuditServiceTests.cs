using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Audit.DTOs;
using AyVino.Api.Features.Audit.Endpoints;
using AyVino.Api.Features.Audit.Enums;
using AyVino.Api.Features.Audit.Models;
using AyVino.Api.Features.Audit.Repositories;
using AyVino.Api.Features.Audit.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace AyVino.UnitTests;

public class AuditServiceTests
{
    [Fact]
    public async Task RecordAsync_ValidEntry_CallsRepositoryCreate()
    {
        // Arrange
        var repository = Substitute.For<IAuditRepository>();
        var logger = Substitute.For<ILogger<AuditService>>();
        var service = new AuditService(repository, logger);

        // Act
        await service.RecordAsync(10, "admin_user", AuditAction.WineryStatusChanged, "Winery", 5, "status=Approved");

        // Assert
        await repository.Received(1).CreateAsync(
            Arg.Is<AuditLogEntry>(e =>
                e.UserId == 10 &&
                e.Username == "admin_user" &&
                e.Action == AuditAction.WineryStatusChanged &&
                e.EntityType == "Winery" &&
                e.EntityId == 5 &&
                e.Details == "status=Approved"),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task RecordAsync_WhenRepositoryThrows_CatchesAndDoesNotThrow()
    {
        // Arrange
        var repository = Substitute.For<IAuditRepository>();
        repository.CreateAsync(Arg.Any<AuditLogEntry>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("DB down"));

        var logger = Substitute.For<ILogger<AuditService>>();
        var service = new AuditService(repository, logger);

        // Act & Assert - should NOT throw
        var exception = await Record.ExceptionAsync(() =>
            service.RecordAsync(10, "admin_user", AuditAction.WineryDeleted, "Winery", 5, null));

        Assert.Null(exception);
    }

    [Fact]
    public async Task RecordAsync_NullUsername_DefaultsToSistema()
    {
        // Arrange
        var repository = Substitute.For<IAuditRepository>();
        var logger = Substitute.For<ILogger<AuditService>>();
        var service = new AuditService(repository, logger);

        // Act
        await service.RecordAsync(null, "", AuditAction.CityStatusChanged, "City", 1, null);

        // Assert
        await repository.Received(1).CreateAsync(
            Arg.Is<AuditLogEntry>(e => e.Username == "Sistema"),
            Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(-1, 10)]
    public async Task GetPagedAsync_InvalidPageNumber_ThrowsValidationException(int pageNumber, int pageSize)
    {
        // Arrange
        var repository = Substitute.For<IAuditRepository>();
        var logger = Substitute.For<ILogger<AuditService>>();
        var service = new AuditService(repository, logger);

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() =>
            service.GetPagedAsync(pageNumber, pageSize));
    }

    [Theory]
    [InlineData(1, 0)]
    [InlineData(1, -5)]
    [InlineData(1, 101)]
    public async Task GetPagedAsync_InvalidPageSize_ThrowsValidationException(int pageNumber, int pageSize)
    {
        // Arrange
        var repository = Substitute.For<IAuditRepository>();
        var logger = Substitute.For<ILogger<AuditService>>();
        var service = new AuditService(repository, logger);

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() =>
            service.GetPagedAsync(pageNumber, pageSize));
    }

    [Fact]
    public async Task GetPagedAsync_InvalidActionString_ThrowsValidationException()
    {
        // Arrange
        var repository = Substitute.For<IAuditRepository>();
        var logger = Substitute.For<ILogger<AuditService>>();
        var service = new AuditService(repository, logger);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.GetPagedAsync(1, 10, action: "InvalidActionName"));

        Assert.Contains("Acción de auditoría inválida", ex.Message);
    }

    [Fact]
    public async Task GetPagedAsync_ValidFilters_ReturnsMappedDtosWithActionAsString()
    {
        // Arrange
        var repository = Substitute.For<IAuditRepository>();
        var date = DateTime.UtcNow;
        repository.GetPagedAsync(1, 10, (short)AuditAction.WineryStatusChanged, "Winery", 10, null, null, Arg.Any<CancellationToken>())
            .Returns([
                new AuditLogEntry
                {
                    Id = 1,
                    UserId = 10,
                    Username = "admin_user",
                    Action = AuditAction.WineryStatusChanged,
                    EntityType = "Winery",
                    EntityId = 5,
                    Details = "status=Approved",
                    CreatedAt = date
                }
            ]);

        var logger = Substitute.For<ILogger<AuditService>>();
        var service = new AuditService(repository, logger);

        // Act
        var result = (await service.GetPagedAsync(1, 10, "WineryStatusChanged", "Winery", 10)).ToList();

        // Assert
        Assert.Single(result);
        var dto = result[0];
        Assert.Equal(1, dto.Id);
        Assert.Equal(10, dto.UserId);
        Assert.Equal("admin_user", dto.Username);
        Assert.Equal("WineryStatusChanged", dto.Action);
        Assert.Equal("Winery", dto.EntityType);
        Assert.Equal(5, dto.EntityId);
        Assert.Equal("status=Approved", dto.Details);
        Assert.Equal(date, dto.CreatedAt);
    }
}
