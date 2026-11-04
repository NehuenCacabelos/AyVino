using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using NSubstitute;
using Xunit;

namespace AyVino.UnitTests;

public class WineryNameMatcherTests
{
    private readonly IWineryNameMatcher _matcher = new WineryNameMatcher();

    [Fact]
    public void VinasDelBalbo_And_VinasDeBalbo_MustMatch()
    {
        // Ambos normalizan a "balbo", similitud 1.0 >= 0.75
        var similarity = _matcher.CalculateSimilarity("Viñas del Balbo", "Viñas de Balbo");
        var isMatch = _matcher.IsMatch("Viñas del Balbo", "Viñas de Balbo");

        Assert.Equal(1.0, similarity);
        Assert.True(isMatch);
    }

    [Fact]
    public void ViniasDeBalbo_And_VinasDeBalbo_MustMatch()
    {
        // "Vinias" normaliza a "vinia" / término genérico removido, quedando "balbo" vs "balbo"
        var similarity = _matcher.CalculateSimilarity("Vinias de balbo", "Viñas de Balbo");
        var isMatch = _matcher.IsMatch("Vinias de balbo", "Viñas de Balbo");

        Assert.True(similarity >= _matcher.DefaultThreshold);
        Assert.True(isMatch);
    }

    [Fact]
    public void BodegaZuccardi_And_Zuccardi_MustMatch()
    {
        // "Bodega" es término genérico vitivinícola filtrado; ambos normalizan a "zuccardi"
        var similarity = _matcher.CalculateSimilarity("Bodega Zuccardi", "Zuccardi");
        var isMatch = _matcher.IsMatch("Bodega Zuccardi", "Zuccardi");

        Assert.Equal(1.0, similarity);
        Assert.True(isMatch);
    }

    [Fact]
    public void VinasDelBalbo_And_VinasDeAltura_MustNotMatch()
    {
        // "balbo" vs "altura" tienen distancia de edición alta (similitud ~0.167 < 0.75)
        var similarity = _matcher.CalculateSimilarity("Viñas del Balbo", "Viñas de Altura");
        var isMatch = _matcher.IsMatch("Viñas del Balbo", "Viñas de Altura");

        Assert.True(similarity < _matcher.DefaultThreshold);
        Assert.False(isMatch);
    }

    [Fact]
    public void Catena_And_CatenaZapata_ThresholdDecision_MustNotMatch()
    {
        // Criterio: En la vitivinicultura argentina, "Catena" y "Catena Zapata" son identidades
        // marcarias o líneas con entidad diferenciada. Para evitar falsos positivos y adopciones erróneas
        // de titularidad sobre etiquetas comunitarias, el umbral de seguridad 0.75 no las considera coincidencia automática.
        // La similitud normalizada por Levenshtein es de 0.4615 (< 0.75).
        var similarity = _matcher.CalculateSimilarity("Catena", "Catena Zapata");
        var isMatch = _matcher.IsMatch("Catena", "Catena Zapata");

        Assert.InRange(similarity, 0.40, 0.50);
        Assert.False(isMatch);
    }

    [Fact]
    public void MinorTypo_InCoreName_MatchesAboveThreshold()
    {
        // "Viñas del Balvo" (con 'v') vs "Viñas de Balbo": "balvo" vs "balbo" tiene Levenshtein = 1, sim = 0.80 >= 0.75
        var similarity = _matcher.CalculateSimilarity("Viñas del Balvo", "Viñas de Balbo");
        var isMatch = _matcher.IsMatch("Viñas del Balvo", "Viñas de Balbo");

        Assert.True(similarity >= 0.75);
        Assert.True(isMatch);
    }

    [Fact]
    public void IdenticalNames_YieldsPerfectScore()
    {
        var similarity = _matcher.CalculateSimilarity("Catena Zapata", "Catena Zapata");
        Assert.Equal(1.0, similarity);
        Assert.True(_matcher.IsMatch("Catena Zapata", "Catena Zapata"));
    }

    [Fact]
    public void EmptyOrNull_HandledGracefully()
    {
        Assert.Equal(0.0, _matcher.CalculateSimilarity("Zuccardi", null));
        Assert.Equal(0.0, _matcher.CalculateSimilarity(null, "Zuccardi"));
        Assert.Equal(1.0, _matcher.CalculateSimilarity(null, null));
        Assert.Equal(1.0, _matcher.CalculateSimilarity("", "   "));
    }

    [Fact]
    public async Task GetClaimCandidatesAsync_IdentifiesApproximateAndExactMatches_AndFiltersNonMatches()
    {
        var wineRepo = Substitute.For<IWineRepository>();
        var wineryRepo = Substitute.For<IWineryRepository>();
        var locationRepo = Substitute.For<ILocationRepository>();
        var grapeRepo = Substitute.For<IGrapeRepository>();

        var winery = new Winery
        {
            Id = 10,
            Name = "Viñas de Balbo",
            UserId = 5,
            Status = WineryStatus.Approved
        };
        wineryRepo.GetByIdAsync(10, Arg.Any<CancellationToken>()).Returns(winery);

        var unclaimedWines = new List<Wine>
        {
            new() { Id = 1, Name = "Balbo Clásico", WineryNameText = "Viñas del Balbo", WineType = WineType.Red },
            new() { Id = 2, Name = "Vino de Altura", WineryNameText = "Viñas de Altura", WineType = WineType.Red },
            new() { Id = 3, Name = "Balbo Malbec", WineryNameText = "Viñas de Balbo", WineType = WineType.Red }
        };
        wineRepo.GetUnclaimedCommunityWinesAsync(Arg.Any<CancellationToken>()).Returns(unclaimedWines);

        var service = new WineService(wineRepo, wineryRepo, locationRepo, grapeRepo);
        var actor = new Actor(5, "User");

        var candidates = (await service.GetClaimCandidatesAsync(10, actor)).ToList();

        Assert.Equal(2, candidates.Count);
        var clasico = candidates.Single(c => c.Id == 1);
        var malbec = candidates.Single(c => c.Id == 3);

        Assert.True(clasico.IsApproximateMatch);
        Assert.False(malbec.IsApproximateMatch);
    }
}
