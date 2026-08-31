using Microsoft.AspNetCore.Http;

namespace AyVino.Api.Common.Exceptions;

public class ValidationException(string message) : AppException(message, StatusCodes.Status400BadRequest)
{
}

