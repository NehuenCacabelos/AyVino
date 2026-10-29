using Microsoft.AspNetCore.Http;

namespace AyVino.Api.Common.Exceptions;

public class UnauthorizedException(string message = "No autorizado.") : AppException(message, StatusCodes.Status401Unauthorized)
{
}

