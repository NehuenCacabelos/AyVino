using System.Text;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Common.Security;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Images.Services;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Locations.Services;
using AyVino.Api.Features.Wineries.DTOs;
using AyVino.Api.Features.Wineries.Enums;
using AyVino.Api.Features.Wineries.Models;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Services;
using AyVino.Api.Features.Wines.DTOs;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Models;
using AyVino.Api.Features.Wines.Repositories;
using AyVino.Api.Features.Wines.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace AyVino.UnitTests;

public class ImageStorageTests
{
    private static IFormFile CreateMockFile(byte[] content, string fileName, string contentType)
    {
        var stream = new MemoryStream(content);
        var file = Substitute.For<IFormFile>();
        file.Length.Returns(content.Length);
        file.FileName.Returns(fileName);
        file.ContentType.Returns(contentType);
        file.OpenReadStream().Returns(_ => new MemoryStream(content));
        return file;
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("users")]
    [InlineData("avatar")]
    [InlineData("../../etc")]
    public void ImageValidator_InvalidFolder_ThrowsUnprocessableEntityException(string? folder)
    {
        var file = CreateMockFile(new byte[20], "test.jpg", "image/jpeg");
        var ex = Assert.Throws<UnprocessableEntityException>(() => ImageValidator.Validate(file, folder));
        Assert.Contains("wineries", ex.Message);
    }

    [Fact]
    public void ImageValidator_NullOrEmptyFile_ThrowsUnprocessableEntityException()
    {
        var ex = Assert.Throws<UnprocessableEntityException>(() => ImageValidator.Validate(null, "wineries"));
        Assert.Contains("archivo de imagen válido", ex.Message);

        var emptyFile = CreateMockFile([], "empty.jpg", "image/jpeg");
        var ex2 = Assert.Throws<UnprocessableEntityException>(() => ImageValidator.Validate(emptyFile, "wineries"));
        Assert.Contains("archivo de imagen válido", ex2.Message);
    }

    [Fact]
    public void ImageValidator_FileExceeds2MB_ThrowsPayloadTooLargeException()
    {
        // 2 MB + 1 byte
        var largeContent = new byte[2 * 1024 * 1024 + 1];
        var file = CreateMockFile(largeContent, "large.jpg", "image/jpeg");

        var ex = Assert.Throws<PayloadTooLargeException>(() => ImageValidator.Validate(file, "wineries"));
        Assert.Contains("2 MB", ex.Message);
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

        var ex = Assert.Throws<UnsupportedMediaTypeException>(() => ImageValidator.Validate(file, "wineries"));
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
        var (ext, mime) = ImageValidator.Validate(file, "vintages");

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
        var (ext, mime) = ImageValidator.Validate(file, "wineries");

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
        var (ext, mime) = ImageValidator.Validate(file, "vintages");

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
        var ex = Assert.Throws<UnprocessableEntityException>(() => ImageValidator.Validate(file, "wineries"));
        Assert.Contains("no coincide", ex.Message);
    }

    [Fact]
    public async Task SupabaseImageStorage_NotConfigured_ThrowsServiceUnavailableException()
    {
        var inMemoryConfig = new Dictionary<string, string?>
        {
            ["Supabase:Url"] = null,
            ["Supabase:ServiceRoleKey"] = null,
            ["Supabase:Bucket"] = null
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();
        var storage = new SupabaseImageStorage(new HttpClient(), config, NullLogger<SupabaseImageStorage>.Instance);

        Assert.False(storage.IsConfigured);
        var ex = await Assert.ThrowsAsync<ServiceUnavailableException>(() =>
            storage.UploadAsync(new MemoryStream(), "test.jpg", "image/jpeg", "wineries"));

        Assert.Contains("no configurado", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void SupabaseImageStorage_IsUrlFromStorage_ValidatesBucketPrefix()
    {
        var inMemoryConfig = new Dictionary<string, string?>
        {
            ["Supabase:Url"] = "https://project123.supabase.co",
            ["Supabase:ServiceRoleKey"] = "dummy-key",
            ["Supabase:Bucket"] = "ayvino-media"
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();
        var storage = new SupabaseImageStorage(new HttpClient(), config, NullLogger<SupabaseImageStorage>.Instance);

        Assert.True(storage.IsConfigured);

        var validUrl = "https://project123.supabase.co/storage/v1/object/public/ayvino-media/wineries/abc.jpg";
        var invalidHostUrl = "https://malicious.com/storage/v1/object/public/ayvino-media/wineries/abc.jpg";
        var invalidBucketUrl = "https://project123.supabase.co/storage/v1/object/public/other-bucket/wineries/abc.jpg";

        Assert.True(storage.IsUrlFromStorage(validUrl));
        Assert.False(storage.IsUrlFromStorage(invalidHostUrl));
        Assert.False(storage.IsUrlFromStorage(invalidBucketUrl));
    }

    [Fact]
    public async Task WineryService_UpdateAsync_WithThirdPartyLogoUrl_ThrowsValidationException()
    {
        var wineryRepo = Substitute.For<IWineryRepository>();
        var existing = new Winery { Id = 1, Name = "Catena", UserId = 10, LocationId = 1, Status = WineryStatus.Approved };
        wineryRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(existing);

        var storage = Substitute.For<IImageStorage>();
        storage.IsUrlFromStorage(Arg.Any<string>()).Returns(false);

        var service = new WineryService(wineryRepo, Substitute.For<ILocationRepository>(), Substitute.For<ICityRepository>(), Substitute.For<IGeorefClient>(), null!, null!, storage);

        var dto = new UpdateWineryRequestDto(
            Name: "Catena Zapata",
            LogoUrl: "https://external-site.com/image.png");

        var actor = new Actor(10, AppRoles.Winery);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.UpdateAsync(1, dto, actor));
        Assert.Contains("almacenamiento oficial", ex.Message);
    }

    [Fact]
    public async Task WineVintageService_CreateAsync_WithThirdPartyImageUrl_ThrowsValidationException()
    {
        var wineRepo = Substitute.For<IWineRepository>();
        wineRepo.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(new Wine { Id = 1, Name = "Malbec 2020", WineryId = null });

        var storage = Substitute.For<IImageStorage>();
        storage.IsUrlFromStorage(Arg.Any<string>()).Returns(false);

        var service = new WineVintageService(Substitute.For<IWineVintageRepository>(), wineRepo, Substitute.For<IGrapeRepository>(), Substitute.For<IWineryRepository>(), storage);

        var dto = new CreateWineVintageRequestDto(
            Year: 2020,
            AlcoholContent: 14.0m,
            ImageUrl: "https://external-host.com/fake-bottle.jpg");

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.CreateAsync(1, dto, new Actor(1, AppRoles.User)));

        Assert.Contains("almacenamiento oficial", ex.Message);
    }
}

