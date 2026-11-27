namespace AyVino.Api.Common.Models;

public sealed record PagedResult<T>(IEnumerable<T> Items, int TotalCount);
