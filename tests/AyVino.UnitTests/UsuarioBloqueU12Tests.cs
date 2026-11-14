using AyVino.Api.Features.Images.Configuration;
using AyVino.Api.Features.Images.Endpoints;
using AyVino.Api.Features.Images.Models;
using AyVino.Api.Features.Images.Repositories;
using AyVino.Api.Features.Images.Services;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AyVino.UnitTests;

public class UsuarioBloqueU12Tests
{
    private readonly CloudinaryOptions _options = new()
    {
        CloudName = "test-cloud",
        ApiKey = "test-key",
        ApiSecret = "test-secret",
        Environment = "dev"
    };

    private readonly ILogger<CloudinaryImageStorage> _logger = Substitute.For<ILogger<CloudinaryImageStorage>>();

    private CloudinaryImageStorage CreateStorage(CloudinaryOptions? options = null)
    {
        var opt = options ?? _options;
        var account = new Account(opt.CloudName, opt.ApiKey, opt.ApiSecret);
        var cloudinary = new Cloudinary(account);
        var wrapper = new CloudinaryClientWrapper(cloudinary);
        return new CloudinaryImageStorage(wrapper, opt, _logger);
    }

    [Fact]
    public void BuildDeliveryUrl_CardVariant_GeneratesExactConfiguredUrl()
    {
        var storage = CreateStorage();
        const string externalId = "sample-image-id";

        var url = storage.BuildDeliveryUrl(externalId, CloudinaryImageStorage.VariantCard);
        const string expected = "https://res.cloudinary.com/test-cloud/image/upload/e_trim:10/c_fit,w_680,h_880/c_pad,w_800,h_1000,b_white/f_auto,q_auto/sample-image-id";

        Assert.Equal(expected, url);
        Assert.EndsWith("/f_auto,q_auto/sample-image-id", url);
    }

    [Fact]
    public void BuildDeliveryUrl_DetailVariant_GeneratesExactConfiguredUrl()
    {
        var storage = CreateStorage();
        const string externalId = "sample-image-id";

        var url = storage.BuildDeliveryUrl(externalId, CloudinaryImageStorage.VariantDetail);
        const string expected = "https://res.cloudinary.com/test-cloud/image/upload/e_trim:10/c_fit,w_1020,h_1320/c_pad,w_1200,h_1500,b_white/f_auto,q_auto/sample-image-id";

        Assert.Equal(expected, url);
        Assert.EndsWith("/f_auto,q_auto/sample-image-id", url);
    }

    [Fact]
    public void BuildDeliveryUrl_ThumbVariant_GeneratesExactConfiguredUrl()
    {
        var storage = CreateStorage();
        const string externalId = "sample-image-id";

        var url = storage.BuildDeliveryUrl(externalId, CloudinaryImageStorage.VariantThumb);
        const string expected = "https://res.cloudinary.com/test-cloud/image/upload/e_trim:10/c_fit,w_136,h_176/c_pad,w_160,h_200,b_white/f_auto,q_auto/sample-image-id";

        Assert.Equal(expected, url);
        Assert.EndsWith("/f_auto,q_auto/sample-image-id", url);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("unknown_variant")]
    [InlineData("bottle")]
    [InlineData("invalid")]
    public void BuildDeliveryUrl_UnknownOrMissingVariant_FallsBackToCard(string? variant)
    {
        var storage = CreateStorage();
        const string externalId = "sample-image-id";

        var url = storage.BuildDeliveryUrl(externalId, variant);
        const string expected = "https://res.cloudinary.com/test-cloud/image/upload/e_trim:10/c_fit,w_680,h_880/c_pad,w_800,h_1000,b_white/f_auto,q_auto/sample-image-id";

        Assert.Equal(expected, url);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void BuildDeliveryUrl_EmptyExternalId_ReturnsEmptyFallback(string? emptyId)
    {
        var storage = CreateStorage();
        var url = storage.BuildDeliveryUrl(emptyId!, CloudinaryImageStorage.VariantCard);
        Assert.Equal(string.Empty, url);
    }

    [Theory]
    [InlineData(CloudinaryImageStorage.VariantCard)]
    [InlineData(CloudinaryImageStorage.VariantDetail)]
    [InlineData(CloudinaryImageStorage.VariantThumb)]
    [InlineData(null)]
    [InlineData("unknown")]
    public void WineVariants_NeverContainProhibitedEffectsOrTransparentBackground(string? variant)
    {
        var storage = CreateStorage();
        const string externalId = "vinos/malbec-reserva";

        var url = storage.BuildDeliveryUrl(externalId, variant);

        Assert.DoesNotContain("e_make_transparent", url);
        Assert.DoesNotContain("background_removal", url);
        Assert.DoesNotContain("bgremoval", url);
        Assert.DoesNotContain("b_transparent", url);
        Assert.Contains("b_white", url);
        Assert.Contains("e_trim:10", url);
    }

    [Fact]
    public async Task ImageEndpoints_GetImageById_RedirectsToDeliveryUrlWithCacheHeader()
    {
        var imageRepo = Substitute.For<IImageRepository>();
        var imageStorage = Substitute.For<IImageStorage>();
        var httpContext = new DefaultHttpContext();

        var imageId = Guid.NewGuid();
        var storedImage = new Image
        {
            Id = imageId,
            ExternalId = "dev/cosechas/sample-id",
            MimeType = "image/webp",
            SizeBytes = 4096,
            Width = 800,
            Height = 1000
        };

        imageRepo.GetByIdAsync(imageId, Arg.Any<CancellationToken>())
            .Returns(storedImage);

        const string expectedUrl = "https://res.cloudinary.com/test-cloud/image/upload/e_trim:10/c_fit,w_680,h_880/c_pad,w_800,h_1000,b_white/f_auto,q_auto/dev/cosechas/sample-id";
        imageStorage.BuildDeliveryUrl("dev/cosechas/sample-id", "card").Returns(expectedUrl);

        var result = await ImageEndpoints.GetImageByIdAsync(
            imageId,
            "card",
            imageRepo,
            imageStorage,
            httpContext,
            CancellationToken.None);

        var redirectResult = Assert.IsType<RedirectHttpResult>(result);
        Assert.Equal(expectedUrl, redirectResult.Url);
        Assert.False(redirectResult.Permanent);
        Assert.Equal("public, max-age=604800", httpContext.Response.Headers.CacheControl.ToString());
    }
}
