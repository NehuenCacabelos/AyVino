namespace AyVino.Api.Common.Exceptions;

public abstract class AppException(string message, int statusCode = 500, IDictionary<string, object?>? extensions = null) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public IDictionary<string, object?> Extensions { get; } = extensions ?? new Dictionary<string, object?>();
}

