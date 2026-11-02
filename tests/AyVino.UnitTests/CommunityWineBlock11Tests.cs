using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using NSubstitute;
using Xunit;

namespace AyVino.UnitTests;

public class CommunityWineBlock11Tests
{
    private readonly IWineRepository _wineRepo = Substitute.For<IWineRepository>();
    private readonly IWineryRepository _wineryRepo = Substitute.For<IWineryRepository>();
    private readonly ILocationRepository _locationRepo = Substitute.For<ILocationRepository>();
    private readonly IGrapeRepository _grapeRepo = Substitute.For<IGrapeRepository>();

    private WineService CreateWineService() =>
        new(_wineRepo, _wineryRepo, _locationRepo, _grapeRepo);

    // =========================================================================
    // 1. DTO & Mapping: WineListItemDto preserves all Wine fields + 2 new fields
    // =========================================================================
    [Fact]
    public void WineListItemDto_ContainsAllFieldsOfWineResponseDto_PlusThumbnailAndReferenceYear()
    {
        var imageId = Guid.NewGuid();
        var wine = new Wine
        {
            Id = 101,
            WineryId = 20,
            WineryNameText = "Bodega Zuccardi",
            Name = "Piedra Infinita",
            Description = "Malbec de Paraje Altamira",
            WineType = WineType.Red,
            LocationId = 3,
            SourceType = SourceType.Official,
            DuplicateOfWineId = null,
            RatingSum = 48,
            ReviewCount = 10,
            ThumbnailImageId = imageId,
            ReferenceVintageYear = 2021
        };

        var listItem = wine.ToListItemDto();

        Assert.Equal(101, listItem.Id);
        Assert.Equal(20, listItem.WineryId);
        Assert.Equal("Bodega Zuccardi", listItem.WineryNameText);
        Assert.Equal("Piedra Infinita", listItem.Name);
        Assert.Equal("Malbec de Paraje Altamira", listItem.Description);
        Assert.Equal("Red", listItem.WineType);
        Assert.Equal(3, listItem.LocationId);
        Assert.Equal("Official", listItem.SourceType);
        Assert.Null(listItem.DuplicateOfWineId);
        Assert.Equal(4.80m, listItem.AverageRating);
        Assert.Equal(10, listItem.ReviewCount);
        Assert.Equal(imageId, listItem.ThumbnailImageId);
        Assert.Equal(2021, listItem.ReferenceVintageYear);
    }

    [Fact]
    public void WineListItemDto_WhenNoRatingOrUnderFiveReviews_AverageRatingIsNull()
    {
        var wine = new Wine
        {
            Id = 102,
            Name = "Vino Joven",
            WineType = WineType.White,
            SourceType = SourceType.Community,
            RatingSum = 12,
            ReviewCount = 3,
            ThumbnailImageId = null,
            ReferenceVintageYear = null
        };

        var listItem = wine.ToListItemDto();

        Assert.Null(listItem.AverageRating);
        Assert.Equal(3, listItem.ReviewCount);
        Assert.Null(listItem.ThumbnailImageId);
        Assert.Null(listItem.ReferenceVintageYear);
    }

    // =========================================================================
    // 2. SQL Visibility: BuildVintageVisibilityCondition reusable fragment
    // =========================================================================
    [Fact]
    public void BuildVintageVisibilityCondition_GeneratesExpectedSqlClausesForAliases()
    {
        var sql = WineRepository.BuildVintageVisibilityCondition("ref_wv", "wy");

        Assert.Contains("@IsAdmin = TRUE", sql);
        Assert.Contains("wy.user_id = @CurrentUserId", sql);
        Assert.Contains("ref_wv.approval_status = 2", sql);
        Assert.Contains("ref_wv.uploaded_by_user_id = @CurrentUserId", sql);
        Assert.Contains("user_vintage_images uvi WHERE uvi.wine_vintage_id = ref_wv.id", sql);
        Assert.Contains("reviews r WHERE r.wine_vintage_id = ref_wv.id", sql);
        Assert.Contains("cellar_items ci JOIN cellars c ON c.id = ci.cellar_id WHERE ci.wine_vintage_id = ref_wv.id", sql);
        Assert.Contains("ref_wv.approval_status = 1", sql);
        Assert.Contains(">= @MinUsers", sql);
    }

    // =========================================================================
    // 3. Service GetAllAsync & SearchAsync: mapping and parameter propagation
    // =========================================================================
    [Fact]
    public async Task GetAllAsync_PropagatesActorAndReturnsWineListItemDtos()
    {
        var imageId = Guid.NewGuid();
        var wineEntity = new Wine
        {
            Id = 1,
            Name = "Gran Malbec",
            WineType = WineType.Red,
            SourceType = SourceType.Community,
            ThumbnailImageId = imageId,
            ReferenceVintageYear = 2020
        };

        _wineRepo.GetAllAsync(1, 12, 10, 5, 2018, 2022, 42, false, Arg.Any<CancellationToken>())
            .Returns([wineEntity]);

        var service = CreateWineService();
        var actor = new Actor(42, AppRoles.User);

        var result = (await service.GetAllAsync(1, 12, 10, 5, 2018, 2022, actor)).ToList();

        Assert.Single(result);
        Assert.Equal(1, result[0].Id);
        Assert.Equal(imageId, result[0].ThumbnailImageId);
        Assert.Equal(2020, result[0].ReferenceVintageYear);

        await _wineRepo.Received(1).GetAllAsync(1, 12, 10, 5, 2018, 2022, 42, false, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetAllAsync_AnonymousCaller_PassesNullUserIdAndFalseIsAdmin()
    {
        _wineRepo.GetAllAsync(1, 12, null, null, null, null, null, false, Arg.Any<CancellationToken>())
            .Returns([]);

        var service = CreateWineService();
        var result = await service.GetAllAsync(1, 12, actor: null);

        Assert.Empty(result);
        await _wineRepo.Received(1).GetAllAsync(1, 12, null, null, null, null, null, false, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SearchAsync_PropagatesSearchCriteriaAndReturnsWineListItemDtos()
    {
        var imageId = Guid.NewGuid();
        var wineEntity = new Wine
        {
            Id = 5,
            Name = "Catena Zapata",
            WineType = WineType.Red,
            SourceType = SourceType.Official,
            ThumbnailImageId = imageId,
            ReferenceVintageYear = 2019
        };

        _wineRepo.SearchAsync("Catena", "Zapata", 2019, WineType.Red, 1, 12, 99, true, Arg.Any<CancellationToken>())
            .Returns([wineEntity]);

        var service = CreateWineService();
        var adminActor = new Actor(99, AppRoles.Admin);

        var result = (await service.SearchAsync("Catena", "Zapata", 2019, "Red", 1, 12, adminActor)).ToList();

        Assert.Single(result);
        Assert.Equal(5, result[0].Id);
        Assert.Equal(imageId, result[0].ThumbnailImageId);
        Assert.Equal(2019, result[0].ReferenceVintageYear);

        await _wineRepo.Received(1).SearchAsync("Catena", "Zapata", 2019, WineType.Red, 1, 12, 99, true, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SearchAsync_AnonymousCaller_PassesNullUserIdAndFalseIsAdmin()
    {
        _wineRepo.SearchAsync("Malbec", null, null, null, 1, 10, null, false, Arg.Any<CancellationToken>())
            .Returns([]);

        var service = CreateWineService();
        var result = await service.SearchAsync("Malbec", null, null, null, 1, 10, actor: null);

        Assert.Empty(result);
        await _wineRepo.Received(1).SearchAsync("Malbec", null, null, null, 1, 10, null, false, Arg.Any<CancellationToken>());
    }

    // =========================================================================
    // 4. Business Rules: Reference Vintage Selection Logic
    // =========================================================================
    public record VintageCandidate(
        int Id,
        int? Year,
        Guid? ImageId,
        ApprovalStatus ApprovalStatus,
        int? UploadedByUserId,
        HashSet<int> ParticipantUserIds,
        int DistinctUserCount);

    /// <summary>
    /// Evaluador de referencia que replica con exactitud la especificación SQL de Bloque 11:
    /// - Filtra visibilidad según el actor (Admin, dueño bodega, uploader/participante, o Pending con >= minUsers).
    /// - Ordena: imagen presente primero (0 vs 1), luego año descendente (nulls last), luego id desc.
    /// - Retorna (ThumbnailImageId, ReferenceVintageYear) de la primera cosecha visible, o (null, null) si no hay visible.
    /// </summary>
    private static (Guid? ThumbnailImageId, int? ReferenceVintageYear) PickReferenceVintage(
        IEnumerable<VintageCandidate> vintages,
        int? currentUserId,
        bool isAdmin,
        int? wineryOwnerUserId = null,
        int minUsers = 2)
    {
        var visible = vintages.Where(v =>
        {
            if (isAdmin) return true;
            if (currentUserId.HasValue && wineryOwnerUserId.HasValue && wineryOwnerUserId.Value == currentUserId.Value)
                return true;
            if (v.ApprovalStatus == ApprovalStatus.Approved)
                return true;
            if (currentUserId.HasValue && (v.UploadedByUserId == currentUserId.Value || v.ParticipantUserIds.Contains(currentUserId.Value)))
                return true;
            if (v.ApprovalStatus == ApprovalStatus.Pending && v.DistinctUserCount >= minUsers)
                return true;
            return false;
        }).ToList();

        if (visible.Count == 0)
            return (null, null);

        var best = visible
            .OrderBy(v => v.ImageId != null ? 0 : 1)
            .ThenByDescending(v => v.Year.HasValue)
            .ThenByDescending(v => v.Year ?? 0)
            .ThenByDescending(v => v.Id)
            .First();

        return (best.ImageId, best.Year);
    }

    [Fact]
    public void ReferenceVintage_WineWithApprovedVintageWithPhoto_ReturnsPhotoAndYear()
    {
        var photoId = Guid.NewGuid();
        var vintages = new List<VintageCandidate>
        {
            new(1, 2020, photoId, ApprovalStatus.Approved, 10, [], 1)
        };

        var (thumb, year) = PickReferenceVintage(vintages, currentUserId: null, isAdmin: false);

        Assert.Equal(photoId, thumb);
        Assert.Equal(2020, year);
    }

    [Fact]
    public void ReferenceVintage_MultipleVintages_MostRecentWithPhotoWins()
    {
        var photo2018 = Guid.NewGuid();
        var photo2020 = Guid.NewGuid();
        var vintages = new List<VintageCandidate>
        {
            new(1, 2018, photo2018, ApprovalStatus.Approved, 10, [], 1),
            new(2, 2020, photo2020, ApprovalStatus.Approved, 10, [], 1),
            new(3, 2022, null, ApprovalStatus.Approved, 10, [], 1) // Más reciente pero sin foto
        };

        // Debe ganar 2020 (la más reciente que SÍ tiene foto) por sobre la 2022 (sin foto) y la 2018 (con foto más antigua)
        var (thumb, year) = PickReferenceVintage(vintages, currentUserId: null, isAdmin: false);

        Assert.Equal(photo2020, thumb);
        Assert.Equal(2020, year);
    }

    [Fact]
    public void ReferenceVintage_NoVintagesWithPhoto_ReturnsNullThumbnailAndMostRecentYear()
    {
        var vintages = new List<VintageCandidate>
        {
            new(1, 2019, null, ApprovalStatus.Approved, 10, [], 1),
            new(2, 2021, null, ApprovalStatus.Approved, 10, [], 1),
            new(3, null, null, ApprovalStatus.Approved, 10, [], 1) // Sin añada
        };

        var (thumb, year) = PickReferenceVintage(vintages, currentUserId: null, isAdmin: false);

        Assert.Null(thumb);
        Assert.Equal(2021, year);
    }

    [Fact]
    public void ReferenceVintage_PendingVintageOfOtherUser_NotUsedForPublic_ButUsedForUploaderAndParticipant()
    {
        var photoPending = Guid.NewGuid();
        var photoApproved = Guid.NewGuid();

        var vintages = new List<VintageCandidate>
        {
            // 2018 Aprobada con foto
            new(1, 2018, photoApproved, ApprovalStatus.Approved, 10, [], 1),
            // 2022 Pending con foto, cargada por usuario 50, participante usuario 60, solo 1 usuario
            new(2, 2022, photoPending, ApprovalStatus.Pending, 50, [60], 1)
        };

        // 1. Usuario anónimo: la 2022 Pending no es visible, gana la 2018 Aprobada
        var anon = PickReferenceVintage(vintages, currentUserId: null, isAdmin: false);
        Assert.Equal(photoApproved, anon.ThumbnailImageId);
        Assert.Equal(2018, anon.ReferenceVintageYear);

        // 2. Usuario tercero (id 999): ve la 2018 Aprobada
        var otherUser = PickReferenceVintage(vintages, currentUserId: 999, isAdmin: false);
        Assert.Equal(photoApproved, otherUser.ThumbnailImageId);
        Assert.Equal(2018, otherUser.ReferenceVintageYear);

        // 3. Usuario uploader (id 50): ve la 2022 Pending, y como tiene foto y es más reciente, gana la 2022
        var uploader = PickReferenceVintage(vintages, currentUserId: 50, isAdmin: false);
        Assert.Equal(photoPending, uploader.ThumbnailImageId);
        Assert.Equal(2022, uploader.ReferenceVintageYear);

        // 4. Usuario participante (id 60): ve la 2022 Pending, gana la 2022
        var participant = PickReferenceVintage(vintages, currentUserId: 60, isAdmin: false);
        Assert.Equal(photoPending, participant.ThumbnailImageId);
        Assert.Equal(2022, participant.ReferenceVintageYear);
    }

    [Fact]
    public void ReferenceVintage_PendingVintageReachingMinUsersThreshold_BecomesUsedForPublic()
    {
        var photoPending = Guid.NewGuid();
        var vintages = new List<VintageCandidate>
        {
            // 2022 Pending con 2 usuarios (umbral alcanzado)
            new(1, 2022, photoPending, ApprovalStatus.Pending, 50, [60], 2)
        };

        // Anónimo ahora ve la 2022 porque alcanzó el umbral de 2 usuarios
        var (thumb, year) = PickReferenceVintage(vintages, currentUserId: null, isAdmin: false, minUsers: 2);

        Assert.Equal(photoPending, thumb);
        Assert.Equal(2022, year);
    }

    [Fact]
    public void ReferenceVintage_WineWithoutVisibleVintages_ReturnsNullForBothFields()
    {
        var vintages = new List<VintageCandidate>
        {
            // Solo una cosecha Pending de otro usuario con 1 usuario
            new(1, 2023, Guid.NewGuid(), ApprovalStatus.Pending, 77, [], 1)
        };

        // Usuario anónimo no ve ninguna cosecha
        var (thumb, year) = PickReferenceVintage(vintages, currentUserId: null, isAdmin: false, minUsers: 2);

        Assert.Null(thumb);
        Assert.Null(year);
    }
}
