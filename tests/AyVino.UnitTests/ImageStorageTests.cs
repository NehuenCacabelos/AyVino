using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Images.Endpoints;
using AyVino.Api.Features.Images.Models;
using AyVino.Api.Features.Images.Repositories;
using AyVino.Api.Features.Images.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace AyVino.UnitTests;

public class ImageStorageTests
{
    private static IFormFile CreateMockFile(byte[] content, string fileName, string contentType)
    {
        var file = Substitute.For<IFormFile>();
        file.Length.Returns(content.Length);
        file.FileName.Returns(fileName);
        file.ContentType.Returns(contentType);
        file.OpenReadStream().Returns(_ => new MemoryStream(content));
        return file;
    }

    [Fact]
    public void ImageValidator_NullOrEmptyFile_ThrowsUnprocessableEntityException()
    {
        var ex = Assert.Throws<UnprocessableEntityException>(() => ImageValidator.Validate(null));
        Assert.Contains("archivo de imagen válido", ex.Message);

        var emptyFile = CreateMockFile([], "empty.jpg", "image/jpeg");
        var ex2 = Assert.Throws<UnprocessableEntityException>(() => ImageValidator.Validate(emptyFile));
        Assert.Contains("archivo de imagen válido", ex2.Message);
    }

    [Fact]
    public void ImageValidator_FileExceeds5MB_ThrowsPayloadTooLargeException()
    {
        // 5 MB + 1 byte
        var largeContent = new byte[5 * 1024 * 1024 + 1];
        var file = CreateMockFile(largeContent, "large.jpg", "image/jpeg");

        var ex = Assert.Throws<PayloadTooLargeException>(() => ImageValidator.Validate(file));
        Assert.Contains("5 MB", ex.Message);
    }

    [Theory]
    [InlineData("application/pdf")]
    [InlineData("text/plain")]
    [InlineData("image/gif")]
    [InlineData("image/svg+xml")]
    public void ImageValidator_DisallowedContentType_ThrowsUnsupportedMediaTypeException(string contentType)
    {
        var content = new byte[50];
        var file = CreateMockFile(content, "test.file", contentType);

        var ex = Assert.Throws<UnsupportedMediaTypeException>(() => ImageValidator.Validate(file));
        Assert.Contains("Solo se aceptan formatos JPG, PNG y WEBP", ex.Message);
    }

    [Fact]
    public void ImageValidator_ValidJpegMagicBytes_ReturnsJpgExtension()
    {
        // JPEG magic bytes: FF D8 FF
        var jpegBytes = new byte[20];
        jpegBytes[0] = 0xFF;
        jpegBytes[1] = 0xD8;
        jpegBytes[2] = 0xFF;

        var file = CreateMockFile(jpegBytes, "bottle.jpg", "image/jpeg");
        var (ext, mime) = ImageValidator.Validate(file);

        Assert.Equal(".jpg", ext);
        Assert.Equal("image/jpeg", mime);
    }

    [Fact]
    public void ImageValidator_ValidPngMagicBytes_ReturnsPngExtension()
    {
        // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
        var pngBytes = new byte[20];
        pngBytes[0] = 0x89;
        pngBytes[1] = 0x50;
        pngBytes[2] = 0x4E;
        pngBytes[3] = 0x47;
        pngBytes[4] = 0x0D;
        pngBytes[5] = 0x0A;
        pngBytes[6] = 0x1A;
        pngBytes[7] = 0x0A;

        var file = CreateMockFile(pngBytes, "logo.png", "image/png");
        var (ext, mime) = ImageValidator.Validate(file);

        Assert.Equal(".png", ext);
        Assert.Equal("image/png", mime);
    }

    [Fact]
    public void ImageValidator_ValidWebpMagicBytes_ReturnsWebpExtension()
    {
        // WEBP magic bytes: RIFF (0..3) ... WEBP (8..11)
        var webpBytes = new byte[20];
        webpBytes[0] = 0x52; // R
        webpBytes[1] = 0x49; // I
        webpBytes[2] = 0x46; // F
        webpBytes[3] = 0x46; // F
        webpBytes[8] = 0x57; // W
        webpBytes[9] = 0x45; // E
        webpBytes[10] = 0x42; // B
        webpBytes[11] = 0x50; // P

        var file = CreateMockFile(webpBytes, "foto.webp", "image/webp");
        var (ext, mime) = ImageValidator.Validate(file);

        Assert.Equal(".webp", ext);
        Assert.Equal("image/webp", mime);
    }

    [Fact]
    public void ImageValidator_DeclaredPngWithJpegBytes_ThrowsUnprocessableEntityException()
    {
        var jpegBytes = new byte[20];
        jpegBytes[0] = 0xFF;
        jpegBytes[1] = 0xD8;
        jpegBytes[2] = 0xFF;

        var file = CreateMockFile(jpegBytes, "fake.png", "image/png");
        var ex = Assert.Throws<UnprocessableEntityException>(() => ImageValidator.Validate(file));
        Assert.Contains("no coincide", ex.Message);
    }

    [Fact]
    public async Task GetImageByIdAsync_ExistingImage_Returns302WithDeliveryUrlAndCacheControlHeader()
    {
        // Arrange
        var id = Guid.NewGuid();
        var externalId = $"test/image/{id}";
        var expectedUrl = $"https://res.cloudinary.com/demo/image/upload/{externalId}";

        var imageRepo = Substitute.For<IImageRepository>();
        imageRepo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(new Image
        {
            Id = id,
            Provider = "cloudinary",
            ExternalId = externalId,
            MimeType = "image/jpeg",
            SizeBytes = 1024,
            Width = 100,
            Height = 100,
            CreatedAt = DateTime.UtcNow
        });

        var storage = Substitute.For<IImageStorage>();
        storage.BuildDeliveryUrl(externalId, null).Returns(expectedUrl);

        var httpContext = new DefaultHttpContext();

        // Act
        var result = await ImageEndpoints.GetImageByIdAsync(id, null, imageRepo, storage, httpContext, CancellationToken.None);

        // Assert
        var redirectResult = Assert.IsType<RedirectHttpResult>(result);
        Assert.Equal(expectedUrl, redirectResult.Url);
        Assert.False(redirectResult.Permanent);
        Assert.Equal("public, max-age=604800", httpContext.Response.Headers.CacheControl.ToString());
    }

    [Theory]
    [InlineData("avatar")]
    [InlineData("logo")]
    [InlineData("banner")]
    [InlineData("bottle")]
    [InlineData("AVATAR")]
    [InlineData("  logo  ")]
    public async Task GetImageByIdAsync_WithValidVariant_PassesNormalizedVariantToStorage(string variant)
    {
        // Arrange
        var id = Guid.NewGuid();
        var externalId = $"test/image/{id}";
        var normalizedVariant = variant.Trim().ToLowerInvariant();
        var expectedUrl = $"https://res.cloudinary.com/demo/image/upload/w_200/{externalId}";

        var imageRepo = Substitute.For<IImageRepository>();
        imageRepo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(new Image
        {
            Id = id,
            Provider = "cloudinary",
            ExternalId = externalId,
            MimeType = "image/png",
            SizeBytes = 2048,
            Width = 200,
            Height = 200,
            CreatedAt = DateTime.UtcNow
        });

        var storage = Substitute.For<IImageStorage>();
        storage.BuildDeliveryUrl(externalId, normalizedVariant).Returns(expectedUrl);

        var httpContext = new DefaultHttpContext();

        // Act
        var result = await ImageEndpoints.GetImageByIdAsync(id, variant, imageRepo, storage, httpContext, CancellationToken.None);

        // Assert
        var redirectResult = Assert.IsType<RedirectHttpResult>(result);
        Assert.Equal(expectedUrl, redirectResult.Url);
        storage.Received(1).BuildDeliveryUrl(externalId, normalizedVariant);
    }

    [Theory]
    [InlineData("invalid")]
    [InlineData("thumb")]
    [InlineData("header")]
    public async Task GetImageByIdAsync_WithInvalidVariant_ThrowsValidationException(string invalidVariant)
    {
        // Arrange
        var id = Guid.NewGuid();
        var imageRepo = Substitute.For<IImageRepository>();
        var storage = Substitute.For<IImageStorage>();
        var httpContext = new DefaultHttpContext();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            ImageEndpoints.GetImageByIdAsync(id, invalidVariant, imageRepo, storage, httpContext, CancellationToken.None));

        Assert.Contains("no válida", ex.Message);
        Assert.Contains("avatar, logo, banner, bottle", ex.Message);
    }

    [Fact]
    public async Task GetImageByIdAsync_NonExistingImage_ThrowsNotFoundException()
    {
        // Arrange
        var id = Guid.NewGuid();
        var imageRepo = Substitute.For<IImageRepository>();
        imageRepo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Image?)null);

        var storage = Substitute.For<IImageStorage>();
        var httpContext = new DefaultHttpContext();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            ImageEndpoints.GetImageByIdAsync(id, null, imageRepo, storage, httpContext, CancellationToken.None));

        Assert.Contains(id.ToString(), ex.Message);
    }
    [Theory]
    [InlineData("AVATAR", "avatar")]
    [InlineData("Logo", "logo")]
    [InlineData("BANNER", "banner")]
    [InlineData("Bottle", "bottle")]
    public async Task GetImageByIdAsync_CaseInsensitiveVariant_NormalizesVariant(string variantInput, string expectedNormalized)
    {
        // Arrange
        var id = Guid.NewGuid();
        var externalId = $"test/image/{id}";
        var expectedUrl = $"https://res.cloudinary.com/demo/image/upload/{externalId}";

        var imageRepo = Substitute.For<IImageRepository>();
        imageRepo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(new Image
        {
            Id = id,
            Provider = "cloudinary",
            ExternalId = externalId,
            MimeType = "image/jpeg",
            SizeBytes = 1024,
            Width = 100,
            Height = 100,
            CreatedAt = DateTime.UtcNow
        });

        var storage = Substitute.For<IImageStorage>();
        storage.BuildDeliveryUrl(externalId, expectedNormalized).Returns(expectedUrl);

        var httpContext = new DefaultHttpContext();

        // Act
        var result = await ImageEndpoints.GetImageByIdAsync(id, variantInput, imageRepo, storage, httpContext, CancellationToken.None);

        // Assert
        var redirectResult = Assert.IsType<RedirectHttpResult>(result);
        Assert.Equal(expectedUrl, redirectResult.Url);
        storage.Received(1).BuildDeliveryUrl(externalId, expectedNormalized);
    }

    [Fact]
    public async Task GetImageByIdAsync_StorageThrowsServiceUnavailable_PropagatesException()
    {
        // Arrange
        var id = Guid.NewGuid();
        var externalId = $"test/image/{id}";

        var imageRepo = Substitute.For<IImageRepository>();
        imageRepo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(new Image
        {
            Id = id,
            Provider = "cloudinary",
            ExternalId = externalId,
            MimeType = "image/jpeg",
            SizeBytes = 1024,
            Width = 100,
            Height = 100,
            CreatedAt = DateTime.UtcNow
        });

        var storage = Substitute.For<IImageStorage>();
        storage.BuildDeliveryUrl(externalId, Arg.Any<string?>()).Returns(_ => throw new ServiceUnavailableException("Cloudinary unavailable"));

        var httpContext = new DefaultHttpContext();

        // Act & Assert
        await Assert.ThrowsAsync<ServiceUnavailableException>(() =>
            ImageEndpoints.GetImageByIdAsync(id, null, imageRepo, storage, httpContext, CancellationToken.None));
    }
}
