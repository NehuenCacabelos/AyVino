using Microsoft.AspNetCore.Http;

namespace AyVino.Api.Common.Exceptions;

public class UnprocessableEntityException(string message)
    : AppException(message, StatusCodes.Status422UnprocessableEntity);

