using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http.Json;

namespace AyVino.Api.Common.Extensions;

public static class JsonOptionsExtensions
{
    public static IServiceCollection ConfigureJsonOptions(this IServiceCollection services)
    {
        services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });

        return services;
    }
}
