using Microsoft.AspNetCore.Http;

namespace AyVino.Api.Common.Exceptions;

public class ConflictException(string message) : AppException(message, StatusCodes.Status409Conflict)
{
}

