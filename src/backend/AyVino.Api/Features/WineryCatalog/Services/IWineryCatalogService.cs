using AyVino.Api.Features.WineryCatalog.DTOs;

namespace AyVino.Api.Features.WineryCatalog.Services;

public interface IWineryCatalogService
{
    Task<WineryCatalogResponseDto> GetMyCatalogAsync(int userId, CancellationToken ct = default);
}
