namespace AyVino.Api.Common.Exceptions;

public abstract class AppException(string message, int statusCode = 500) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public IDictionary<string, object?> Extensions { get; } = new Dictionary<string, object?>();
}
