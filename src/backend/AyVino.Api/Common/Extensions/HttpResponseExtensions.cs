using System.Globalization;

namespace AyVino.Api.Common.Extensions;

public static class HttpResponseExtensions
{
    public const string TotalCountHeader = "X-Total-Count";

    public static void SetTotalCountHeader(this HttpResponse response, int totalCount)
    {
        response.Headers[TotalCountHeader] = totalCount.ToString(CultureInfo.InvariantCulture);
    }

    public static IResult OkWithTotalCount<T>(this HttpResponse response, IEnumerable<T> items, int totalCount)
    {
        response.SetTotalCountHeader(totalCount);
        return Results.Ok(items);
    }
}
