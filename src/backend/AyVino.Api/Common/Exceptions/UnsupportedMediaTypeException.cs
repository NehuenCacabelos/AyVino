namespace AyVino.Api.Common.Exceptions;

public class UnsupportedMediaTypeException(string message)
    : AppException(message, StatusCodes.Status415UnsupportedMediaType);

