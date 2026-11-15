using Microsoft.AspNetCore.Http;

namespace AyVino.Api.Common.Exceptions;

public class ConflictException(string message, IDictionary<string, object?>? extensions = null)
    : AppException(message, StatusCodes.Status409Conflict, extensions)
{
}

