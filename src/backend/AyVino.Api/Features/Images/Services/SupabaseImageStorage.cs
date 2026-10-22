using AyVino.Api.Common.Exceptions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AyVino.Api.Features.Images.Services;

public class SupabaseImageStorage : IImageStorage
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<SupabaseImageStorage> _logger;
    private readonly string? _supabaseUrl;
    private readonly string? _serviceRoleKey;
    private readonly string? _bucket;

    public bool IsConfigured { get; }

    public SupabaseImageStorage(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<SupabaseImageStorage> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        _supabaseUrl = configuration["Supabase:Url"]?.TrimEnd('/');
        _serviceRoleKey = configuration["Supabase:ServiceRoleKey"];
        _bucket = configuration["Supabase:Bucket"]?.Trim('/');

        IsConfigured = !string.IsNullOrWhiteSpace(_supabaseUrl) &&
                       !string.IsNullOrWhiteSpace(_serviceRoleKey) &&
                       !string.IsNullOrWhiteSpace(_bucket);
    }

    public async Task<string> UploadAsync(Stream stream, string fileName, string contentType, string folder, CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            throw new ServiceUnavailableException("Almacenamiento de imágenes no configurado.");
        }

        var uploadUrl = $"{_supabaseUrl}/storage/v1/object/{_bucket}/{folder}/{fileName}";

        using var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
        request.Headers.Add("Authorization", $"Bearer {_serviceRoleKey}");
        request.Headers.Add("apikey", _serviceRoleKey);
        request.Content = new StreamContent(stream);
        request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);

        var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Supabase Storage error: {StatusCode} - {Body}", response.StatusCode, errorBody);
            throw new ServiceUnavailableException("No se pudo completar la subida de la imagen al almacenamiento externo.");
        }

        return $"{_supabaseUrl}/storage/v1/object/public/{_bucket}/{folder}/{fileName}";
    }

    public bool IsUrlFromStorage(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return false;
        }

        if (!IsConfigured)
        {
            return true;
        }

        var expectedBase = $"{_supabaseUrl}/storage/v1/object/public/{_bucket}/";
        return url.StartsWith(expectedBase, StringComparison.OrdinalIgnoreCase);
    }
}

