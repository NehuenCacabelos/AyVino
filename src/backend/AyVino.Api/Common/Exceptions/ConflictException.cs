using Microsoft.AspNetCore.Http;

namespace AyVino.Api.Common.Exceptions;

public class ConflictException : AppException
{
    public ConflictException(string message) : base(message, StatusCodes.Status409Conflict)
    {
    }

    public ConflictException(string message, IDictionary<string, object?> extensions) : base(message, StatusCodes.Status409Conflict)
    {
        foreach (var (key, value) in extensions)
        {
            Extensions[key] = value;
        }
    }
}
