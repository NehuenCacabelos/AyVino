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
        Environment = "dev",
        BottleBackgroundTolerance = CloudinaryOptions.DefaultBottleBackgroundTolerance
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
    public void BottleDeliveryUrl_ContainsMakeTransparent10_BeforePad()
    {
        var storage = CreateStorage();
        var url = storage.BuildDeliveryUrl("vinos/cosecha-2021", CloudinaryImageStorage.VariantBottle);

        // 1. Debe contener e_make_transparent:10
        Assert.Contains("e_make_transparent:10", url);

        // 2. Debe contener el pad
        Assert.Contains("c_pad", url);

        // 3. e_make_transparent:10 debe aparecer antes de c_pad en la URL
        var idxTransparent = url.IndexOf("e_make_transparent:10", StringComparison.Ordinal);
        var idxPad = url.IndexOf("c_pad", StringComparison.Ordinal);
        Assert.True(idxTransparent < idxPad, "e_make_transparent:10 debe aparecer antes de c_pad");

        // 4. URL esperada exacta de referencia
        const string expectedBottleUrl = "https://res.cloudinary.com/test-cloud/image/upload/e_make_transparent:10/b_transparent,c_pad,f_auto,h_1200,q_auto,w_600/v1/vinos/cosecha-2021";
        Assert.Equal(expectedBottleUrl, url);
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
        Assert.DoesNotContain("e_make_transparent", avatarUrl);

        // logo
        var logoUrl = storage.BuildDeliveryUrl(externalId, CloudinaryImageStorage.VariantLogo);
        const string expectedLogo = "https://res.cloudinary.com/test-cloud/image/upload/b_transparent,c_pad,f_auto,h_400,q_auto,w_400/sample-image-id";
        Assert.Equal(expectedLogo, logoUrl);
        Assert.DoesNotContain("e_make_transparent", logoUrl);

        // banner
        var bannerUrl = storage.BuildDeliveryUrl(externalId, CloudinaryImageStorage.VariantBanner);
        const string expectedBanner = "https://res.cloudinary.com/test-cloud/image/upload/c_fill,f_auto,g_auto,h_640,q_auto,w_1920/sample-image-id";
        Assert.Equal(expectedBanner, bannerUrl);
        Assert.DoesNotContain("e_make_transparent", bannerUrl);

        // sin variante (null)
        var defaultUrl = storage.BuildDeliveryUrl(externalId, null);
        const string expectedDefault = "https://res.cloudinary.com/test-cloud/image/upload/f_auto,q_auto/sample-image-id";
        Assert.Equal(expectedDefault, defaultUrl);
        Assert.DoesNotContain("e_make_transparent", defaultUrl);
    }

    [Fact]
    public void BottleDeliveryUrl_RespectsConfiguredTolerance()
    {
        var customOptions = new CloudinaryOptions
        {
            CloudName = "test-cloud",
            ApiKey = "test-key",
            ApiSecret = "test-secret",
            Environment = "dev",
            BottleBackgroundTolerance = 25
        };

        var storage = CreateStorage(customOptions);
        var url = storage.BuildDeliveryUrl("vinos/cosecha-2021", CloudinaryImageStorage.VariantBottle);

        Assert.Contains("e_make_transparent:25", url);
        const string expectedBottleUrl = "https://res.cloudinary.com/test-cloud/image/upload/e_make_transparent:25/b_transparent,c_pad,f_auto,h_1200,q_auto,w_600/v1/vinos/cosecha-2021";
        Assert.Equal(expectedBottleUrl, url);
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
            Width = 600,
            Height = 1200
        };

        imageRepo.GetByIdAsync(imageId, Arg.Any<CancellationToken>())
            .Returns(storedImage);

        imageStorage.BuildDeliveryUrl("dev/cosechas/test-guid", "bottle")
            .Returns("https://res.cloudinary.com/test-cloud/image/upload/e_make_transparent:10/dev/cosechas/test-guid");

        var result = await ImageEndpoints.GetImageByIdAsync(
            imageId,
            "bottle",
            imageRepo,
            imageStorage,
            httpContext,
            CancellationToken.None);

        var redirectResult = Assert.IsType<RedirectHttpResult>(result);
        Assert.Equal("https://res.cloudinary.com/test-cloud/image/upload/e_make_transparent:10/dev/cosechas/test-guid", redirectResult.Url);
        Assert.False(redirectResult.Permanent);
        Assert.Equal("public, max-age=604800", httpContext.Response.Headers.CacheControl.ToString());
    }
}
