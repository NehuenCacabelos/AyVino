using Microsoft.AspNetCore.Http;

namespace AyVino.Api.Common.Exceptions;

public class NotFoundException(string message) : AppException(message, StatusCodes.Status404NotFound)
{
}

