using Microsoft.AspNetCore.Http;

namespace AyVino.Api.Common.Exceptions;

public class ForbiddenException(string message) : AppException(message, StatusCodes.Status403Forbidden)
{
}
