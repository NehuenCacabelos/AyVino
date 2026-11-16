using AyVino.Api.Features.Sensory.Models;

namespace AyVino.Api.Features.Sensory.Repositories;

public record GrapeWithSensoryRow(int GrapeId, decimal? Percentage, short? TypicalBody, short? TypicalTannins, short? TypicalAcidity);
public record GrapeSensoryValuesRow(int GrapeId, short? TypicalBody, short? TypicalTannins, short? TypicalAcidity);

public interface ISensoryRepository
{
    Task<WineVintageSensory?> GetByVintageIdAsync(int vintageId, CancellationToken ct = default);
    Task UpsertAsync(WineVintageSensory sensory, CancellationToken ct = default);
    Task<bool> DeleteAsync(int vintageId, CancellationToken ct = default);
    Task<IReadOnlyList<GrapeWithSensoryRow>> GetVintageGrapesWithTypicalValuesAsync(int vintageId, CancellationToken ct = default);
    Task<IReadOnlyDictionary<int, GrapeSensoryValuesRow>> GetGrapeTypicalValuesByIdsAsync(IEnumerable<int> grapeIds, CancellationToken ct = default);
}
