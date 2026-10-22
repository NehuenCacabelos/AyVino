using System.Text;
using AyVino.Api.Common.Exceptions;
using AyVino.Api.Features.Users.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using NSubstitute;

namespace AyVino.UnitTests;

public class AvatarStorageServiceTests : IDisposable
{
    private readonly IWebHostEnvironment _environment = Substitute.For<IWebHostEnvironment>();
    private readonly string _testWebRoot;
    private readonly AvatarStorageService _storageService;

    public AvatarStorageServiceTests()
    {
        _testWebRoot = Path.Combine(Path.GetTempPath(), "ayvino_test_avatars_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_testWebRoot);

        _environment.WebRootPath.Returns(_testWebRoot);
        _storageService = new AvatarStorageService(_environment);
    }

    public void Dispose()
    {
        if (Directory.Exists(_testWebRoot))
        {
            try
            {
                Directory.Delete(_testWebRoot, recursive: true);
            }
            catch
            {
                // Ignorar en cleanup de test
            }
        }
    }

    [Fact]
    public async Task SaveAvatarAsync_NullOrEmptyFile_ThrowsValidationException()
    {
        var emptyFile = Substitute.For<IFormFile>();
        emptyFile.Length.Returns(0);

        await Assert.ThrowsAsync<ValidationException>(() => _storageService.SaveAvatarAsync(1, null!));
        await Assert.ThrowsAsync<ValidationException>(() => _storageService.SaveAvatarAsync(1, emptyFile));
    }

    [Fact]
    public async Task SaveAvatarAsync_FileExceeds5Mb_ThrowsValidationException()
    {
        var largeFile = Substitute.For<IFormFile>();
        largeFile.Length.Returns(6 * 1024 * 1024); // 6 MB
        largeFile.FileName.Returns("avatar.jpg");
        largeFile.ContentType.Returns("image/jpeg");

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _storageService.SaveAvatarAsync(1, largeFile));
        Assert.Contains("5 MB", ex.Message);
    }

    [Theory]
    [InlineData("avatar.exe")]
    [InlineData("avatar.pdf")]
    [InlineData("avatar.txt")]
    [InlineData("avatar")]
    public async Task SaveAvatarAsync_InvalidExtension_ThrowsValidationException(string fileName)
    {
        var file = Substitute.For<IFormFile>();
        file.Length.Returns(1024);
        file.FileName.Returns(fileName);
        file.ContentType.Returns("image/jpeg");

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _storageService.SaveAvatarAsync(1, file));
        Assert.Contains("Formato", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task SaveAvatarAsync_InvalidContentType_ThrowsValidationException()
    {
        var file = Substitute.For<IFormFile>();
        file.Length.Returns(1024);
        file.FileName.Returns("avatar.png");
        file.ContentType.Returns("application/octet-stream");

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _storageService.SaveAvatarAsync(1, file));
        Assert.Contains("tipo de contenido", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task SaveAvatarAsync_ValidFile_SavesToDiskAndReturnsRelativeUrl()
    {
        var content = "dummy image content"u8.ToArray();
        using var stream = new MemoryStream(content);

        var file = new FormFile(stream, 0, content.Length, "file", "my-photo.webp")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/webp"
        };

        var relativeUrl = await _storageService.SaveAvatarAsync(42, file);

        Assert.NotNull(relativeUrl);
        Assert.StartsWith("/uploads/avatars/42_", relativeUrl);
        Assert.EndsWith(".webp", relativeUrl);

        var expectedFilePath = Path.Combine(_testWebRoot, relativeUrl.TrimStart('/'));
        Assert.True(File.Exists(expectedFilePath));
    }

    [Fact]
    public async Task DeleteAvatarAsync_ExistingFile_DeletesFromDisk()
    {
        var avatarsDir = Path.Combine(_testWebRoot, "uploads", "avatars");
        Directory.CreateDirectory(avatarsDir);
        var testFile = Path.Combine(avatarsDir, "test_to_delete.jpg");
        await File.WriteAllTextAsync(testFile, "test data");

        Assert.True(File.Exists(testFile));

        await _storageService.DeleteAvatarAsync("/uploads/avatars/test_to_delete.jpg");

        Assert.False(File.Exists(testFile));
    }

    [Fact]
    public async Task DeleteAvatarAsync_ExternalOrInvalidUrl_DoesNothing()
    {
        await _storageService.DeleteAvatarAsync(null);
        await _storageService.DeleteAvatarAsync("https://example.com/avatar.jpg");
        await _storageService.DeleteAvatarAsync("/other/path/avatar.jpg");
    }
}

