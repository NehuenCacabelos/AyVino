using AyVino.Api.Features.Uncorks.DTOs;

namespace AyVino.Api.Features.Uncorks.Services;

public interface IUncorkService
{
    Task<UncorkResponseDto> UncorkAsync(int userId, UncorkRequestDto request, CancellationToken ct = default);
}
