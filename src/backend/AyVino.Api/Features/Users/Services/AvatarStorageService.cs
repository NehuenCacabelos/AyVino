using AyVino.Api.Common.Exceptions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace AyVino.Api.Features.Users.Services;

public class AvatarStorageService(IWebHostEnvironment environment) : IAvatarStorageService
{
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp"
    };

    public async Task<string> SaveAvatarAsync(int userId, IFormFile file, CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
        {
            throw new ValidationException("El archivo de imagen no puede estar vacío.");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            throw new ValidationException("La imagen no puede superar los 5 MB.");
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
        {
            throw new ValidationException("El formato del archivo no es válido. Formatos permitidos: JPG, PNG, WEBP.");
        }

        if (!string.IsNullOrWhiteSpace(file.ContentType) && !AllowedContentTypes.Contains(file.ContentType))
        {
            throw new ValidationException("El tipo de contenido no es válido. Debe ser una imagen JPG, PNG o WEBP.");
        }

        var webRoot = environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var avatarsDir = Path.Combine(webRoot, "uploads", "avatars");

        if (!Directory.Exists(avatarsDir))
        {
            Directory.CreateDirectory(avatarsDir);
        }

        var fileName = $"{userId}_{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var targetFilePath = Path.Combine(avatarsDir, fileName);

        await using (var fileStream = new FileStream(targetFilePath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, useAsync: true))
        {
            await file.CopyToAsync(fileStream, ct);
        }

        return $"/uploads/avatars/{fileName}";
    }

    public Task DeleteAvatarAsync(string? photoUrl, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(photoUrl))
        {
            return Task.CompletedTask;
        }

        const string prefix = "/uploads/avatars/";
        if (!photoUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return Task.CompletedTask;
        }

        var fileName = Path.GetFileName(photoUrl);
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return Task.CompletedTask;
        }

        var webRoot = environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var filePath = Path.Combine(webRoot, "uploads", "avatars", fileName);

        if (File.Exists(filePath))
        {
            try
            {
                File.Delete(filePath);
            }
            catch (IOException)
            {
                // Silenciosamente ignorar si el archivo está en uso para no bloquear la operación
            }
        }

        return Task.CompletedTask;
    }
}

