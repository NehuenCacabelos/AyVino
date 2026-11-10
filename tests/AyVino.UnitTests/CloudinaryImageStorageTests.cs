using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Images.Configuration;
using AyVino.Api.Features.Images.Models;
using AyVino.Api.Features.Images.Services;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace AyVino.UnitTests;

public class CloudinaryImageStorageTests
{
    private readonly ICloudinaryClient _client = Substitute.For<ICloudinaryClient>();
    private readonly ILogger<CloudinaryImageStorage> _logger = Substitute.For<ILogger<CloudinaryImageStorage>>();
    private readonly CloudinaryOptions _options = new()
    {
        CloudName = "test-cloud",
        ApiKey = "test-key",
        ApiSecret = "test-secret",
        Environment = "dev"
    };

    [Fact]
    public void CloudinaryOptions_Validate_ThrowsWhenMissingValues()
    {
        var empty = new CloudinaryOptions();
        Assert.Throws<InvalidOperationException>(() => empty.Validate());

        var noKey = new CloudinaryOptions { CloudName = "c" };
        Assert.Throws<InvalidOperationException>(() => noKey.Validate());

        var noSecret = new CloudinaryOptions { CloudName = "c", ApiKey = "k" };
        Assert.Throws<InvalidOperationException>(() => noSecret.Validate());

        var invalidEnv = new CloudinaryOptions { CloudName = "c", ApiKey = "k", ApiSecret = "s", Environment = "staging" };
        Assert.Throws<InvalidOperationException>(() => invalidEnv.Validate());

        var valid = new CloudinaryOptions { CloudName = "c", ApiKey = "k", ApiSecret = "s", Environment = "dev" };
        valid.Validate(); // Should not throw
    }

    [Theory]
    [InlineData(ImageType.Avatar, "dev/avatares")]
    [InlineData(ImageType.WineryLogo, "dev/logos-bodega")]
    [InlineData(ImageType.WineryBanner, "dev/banners-bodega")]
    [InlineData(ImageType.WineVintage, "dev/cosechas")]
    public async Task UploadAsync_PassesExactPublicIdAndAssetFolder(ImageType imageType, string expectedFolder)
    {
        var storage = new CloudinaryImageStorage(_client, _options, _logger);
        var id = Guid.NewGuid();
        using var stream = new MemoryStream([1, 2, 3]);

        _client.UploadAsync(Arg.Any<ImageUploadParams>(), Arg.Any<CancellationToken>())
            .Returns(new StoredImageResult(id.ToString("D"), 400, 400, 1024));

        var result = await storage.UploadAsync(id, stream, "image/jpeg", imageType);

        Assert.Equal(id.ToString("D"), result.ExternalId);
        Assert.Equal(400, result.Width);
        Assert.Equal(400, result.Height);
        Assert.Equal(1024, result.SizeBytes);

        await _client.Received(1).UploadAsync(
            Arg.Is<ImageUploadParams>(p =>
                p.PublicId == id.ToString("D") &&
                p.AssetFolder == expectedFolder &&
                p.Overwrite == false &&
                p.UseFilename == false &&
                p.UniqueFilename == false),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteAsync_SetsInvalidateTrue_ReturnsTrueOnOk()
    {
        var storage = new CloudinaryImageStorage(_client, _options, _logger);
        var externalId = Guid.NewGuid().ToString("D");

        _client.DestroyAsync(Arg.Any<DeletionParams>())
            .Returns(new DeletionResult { Result = "ok" });

        var success = await storage.DeleteAsync(externalId);

        Assert.True(success);
        await _client.Received(1).DestroyAsync(Arg.Is<DeletionParams>(p =>
            p.PublicId == externalId && p.Invalidate == true));
    }

    [Fact]
    public async Task DeleteAsync_HandlesExceptionGracefully_ReturnsFalse()
    {
        var storage = new CloudinaryImageStorage(_client, _options, _logger);
        var externalId = Guid.NewGuid().ToString("D");

        _client.DestroyAsync(Arg.Any<DeletionParams>())
            .Throws(new HttpRequestException("Cloudinary unavailable"));

        var success = await storage.DeleteAsync(externalId);

        Assert.False(success);
    }

    [Fact]
    public void BuildDeliveryUrl_ThrowsWhenExternalIdIsEmpty()
    {
        var storage = new CloudinaryImageStorage(_client, _options, _logger);
        Assert.Throws<ArgumentException>(() => storage.BuildDeliveryUrl("", "avatar"));
        Assert.Throws<ArgumentException>(() => storage.BuildDeliveryUrl("   ", "avatar"));
    }

    [Fact]
    public void BuildDeliveryUrl_ThrowsValidationExceptionOnUnknownVariant()
    {
        var storage = new CloudinaryImageStorage(_client, _options, _logger);
        Assert.Throws<ValidationException>(() => storage.BuildDeliveryUrl("my-id", "unsupported-variant"));
    }

    [Theory]
    [InlineData("avatar")]
    [InlineData("logo")]
    [InlineData("banner")]
    [InlineData("bottle")]
    [InlineData(null)]
    public void BuildDeliveryUrl_BuildsUrlForAllowedVariants(string? variant)
    {
        var storage = new CloudinaryImageStorage(_client, _options, _logger);
        _client.BuildUrl("my-id", Arg.Any<CloudinaryDotNet.Transformation>())
            .Returns("https://res.cloudinary.com/test-cloud/image/upload/my-id");

        var url = storage.BuildDeliveryUrl("my-id", variant);

        Assert.Equal("https://res.cloudinary.com/test-cloud/image/upload/my-id", url);
        _client.Received(1).BuildUrl("my-id", Arg.Any<CloudinaryDotNet.Transformation>());
    }
}
