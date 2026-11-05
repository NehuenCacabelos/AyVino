using AyVino.Api.Common.Exceptions;
using Microsoft.AspNetCore.Http;

namespace AyVino.Api.Features.Images.Services;

public static class ImageValidator
{
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    public static (string Extension, string ContentType) Validate(IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            throw new UnprocessableEntityException("Debe proporcionar un archivo de imagen válido.");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            throw new PayloadTooLargeException("El tamaño del archivo no puede superar los 5 MB.");
        }

        var contentType = file.ContentType?.Trim().ToLowerInvariant();
        if (contentType is not ("image/jpeg" or "image/jpg" or "image/png" or "image/webp"))
        {
            throw new UnsupportedMediaTypeException("El tipo de archivo no está permitido. Solo se aceptan formatos JPG, PNG y WEBP.");
        }

        using var stream = file.OpenReadStream();
        var header = new byte[12];
        var bytesRead = stream.Read(header, 0, header.Length);

        if (bytesRead < 12)
        {
            throw new UnprocessableEntityException("El archivo es demasiado pequeño o está corrupto.");
        }

        var detectedType = DetectImageType(header);
        if (detectedType == null)
        {
            throw new UnsupportedMediaTypeException("La firma del archivo (magic bytes) no corresponde a un formato JPG, PNG o WEBP válido.");
        }

        // Validar correspondencia entre Content-Type declarado y firma de bytes
        if (detectedType == "jpg" && contentType is not ("image/jpeg" or "image/jpg"))
        {
            throw new UnprocessableEntityException("El contenido del archivo no coincide con el tipo MIME declarado.");
        }
        if (detectedType == "png" && contentType != "image/png")
        {
            throw new UnprocessableEntityException("El contenido del archivo no coincide con el tipo MIME declarado.");
        }
        if (detectedType == "webp" && contentType != "image/webp")
        {
            throw new UnprocessableEntityException("El contenido del archivo no coincide con el tipo MIME declarado.");
        }

        var canonicalContentType = detectedType switch
        {
            "jpg" => "image/jpeg",
            "png" => "image/png",
            "webp" => "image/webp",
            _ => contentType
        };

        return ($".{detectedType}", canonicalContentType);
    }

    private static string? DetectImageType(byte[] header)
    {
        // JPEG: FF D8 FF
        if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
        {
            return "jpg";
        }

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47 &&
            header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A)
        {
            return "png";
        }

        // WEBP: RIFF .... WEBP
        // header[0..3] = "RIFF", header[8..11] = "WEBP"
        if (header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 &&
            header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50)
        {
            return "webp";
        }

        return null;
    }
}
