using Microsoft.AspNetCore.Http;

namespace AyVino.Api.Common.Exceptions;

public class ServiceUnavailableException(string message)
    : AppException(message, StatusCodes.Status503ServiceUnavailable);
