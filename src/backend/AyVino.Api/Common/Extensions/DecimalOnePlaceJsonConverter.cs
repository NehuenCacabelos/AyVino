using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AyVino.Api.Common.Extensions;

public class DecimalOnePlaceJsonConverter : JsonConverter<decimal>
{
    public override decimal Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.GetDecimal();
    }

    public override void Write(Utf8JsonWriter writer, decimal value, JsonSerializerOptions options)
    {
        writer.WriteRawValue(value.ToString("0.0", CultureInfo.InvariantCulture));
    }
}

public class NullableDecimalOnePlaceJsonConverter : JsonConverter<decimal?>
{
    public override decimal? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }

        return reader.GetDecimal();
    }

    public override void Write(Utf8JsonWriter writer, decimal? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
        {
            writer.WriteRawValue(value.Value.ToString("0.0", CultureInfo.InvariantCulture));
        }
        else
        {
            writer.WriteNullValue();
        }
    }
}
