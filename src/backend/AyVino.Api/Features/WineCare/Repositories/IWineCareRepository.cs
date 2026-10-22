using AyVino.Api.Features.WineCare.Models;

namespace AyVino.Api.Features.WineCare.Repositories;

public interface IWineCareRepository
{
    Task<IEnumerable<WineCareVintageRow>> GetVintageRowsAsync(IReadOnlyCollection<int> vintageIds, CancellationToken ct = default);
    Task<IEnumerable<WineCareGrapeRow>> GetGrapeRowsAsync(IReadOnlyCollection<int> vintageIds, CancellationToken ct = default);
}