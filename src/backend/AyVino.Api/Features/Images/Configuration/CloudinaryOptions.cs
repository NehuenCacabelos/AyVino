namespace AyVino.Api.Features.Images.Configuration;

public class CloudinaryOptions
{
    public const string SectionName = "Cloudinary";

    public string CloudName { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string ApiSecret { get; set; } = string.Empty;
    public string Environment { get; set; } = "dev";

    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(CloudName))
        {
            throw new InvalidOperationException("Falta configurar 'Cloudinary:CloudName'.");
        }

        if (string.IsNullOrWhiteSpace(ApiKey))
        {
            throw new InvalidOperationException("Falta configurar 'Cloudinary:ApiKey'.");
        }

        if (string.IsNullOrWhiteSpace(ApiSecret))
        {
            throw new InvalidOperationException("Falta configurar 'Cloudinary:ApiSecret'.");
        }

        if (string.IsNullOrWhiteSpace(Environment))
        {
            throw new InvalidOperationException("Falta configurar 'Cloudinary:Environment'.");
        }

        if (!string.Equals(Environment, "dev", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(Environment, "prod", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("El valor de 'Cloudinary:Environment' debe ser 'dev' o 'prod'.");
        }
    }
}
