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

public class UsuarioBloqueU7Tests
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
    public void NonBottleVariants_MatchExactReferenceStrings()
    {
        var storage = CreateStorage();
        const string externalId = "sample-image-id";

        // avatar
        var avatarUrl = storage.BuildDeliveryUrl(externalId, CloudinaryImageStorage.VariantAvatar);
        const string expectedAvatar = "https://res.cloudinary.com/test-cloud/image/upload/c_thumb,f_auto,g_face,h_256,q_auto,w_256/sample-image-id";
        Assert.Equal(expectedAvatar, avatarUrl);

        // logo
        var logoUrl = storage.BuildDeliveryUrl(externalId, CloudinaryImageStorage.VariantLogo);
        Assert.Contains("c_pad", logoUrl);
        Assert.Contains("h_400", logoUrl);
        Assert.Contains("w_400", logoUrl);

        // banner
        var bannerUrl = storage.BuildDeliveryUrl(externalId, CloudinaryImageStorage.VariantBanner);
        const string expectedBanner = "https://res.cloudinary.com/test-cloud/image/upload/c_fill,f_auto,g_auto,h_640,q_auto,w_1920/sample-image-id";
        Assert.Equal(expectedBanner, bannerUrl);

        // sin variante (null) cae en card
        var defaultUrl = storage.BuildDeliveryUrl(externalId, null);
        const string expectedDefault = "https://res.cloudinary.com/test-cloud/image/upload/e_trim:10/c_fit,w_680,h_880/c_pad,w_800,h_1000,b_white/f_auto,q_auto/sample-image-id";
        Assert.Equal(expectedDefault, defaultUrl);
    }

    [Fact]
    public async Task GetImageById_AllowsExtraVersionParamAndReturnsRedirect()
    {
        var imageRepo = Substitute.For<IImageRepository>();
        var imageStorage = Substitute.For<IImageStorage>();
        var httpContext = new DefaultHttpContext();

        var imageId = Guid.NewGuid();
        var storedImage = new Image
        {
            Id = imageId,
            ExternalId = "dev/cosechas/test-guid",
            MimeType = "image/jpeg",
            SizeBytes = 1024,
            Width = 800,
            Height = 1000
        };

        imageRepo.GetByIdAsync(imageId, Arg.Any<CancellationToken>())
            .Returns(storedImage);

        imageStorage.BuildDeliveryUrl("dev/cosechas/test-guid", "card")
            .Returns("https://res.cloudinary.com/test-cloud/image/upload/e_trim:10/c_fit,w_680,h_880/c_pad,w_800,h_1000,b_white/f_auto,q_auto/dev/cosechas/test-guid");

        var result = await ImageEndpoints.GetImageByIdAsync(
            imageId,
            "card",
            imageRepo,
            imageStorage,
            httpContext,
            CancellationToken.None);

        var redirectResult = Assert.IsType<RedirectHttpResult>(result);
        Assert.Equal("https://res.cloudinary.com/test-cloud/image/upload/e_trim:10/c_fit,w_680,h_880/c_pad,w_800,h_1000,b_white/f_auto,q_auto/dev/cosechas/test-guid", redirectResult.Url);
        Assert.False(redirectResult.Permanent);
        Assert.Equal("public, max-age=604800", httpContext.Response.Headers.CacheControl.ToString());
    }
}
