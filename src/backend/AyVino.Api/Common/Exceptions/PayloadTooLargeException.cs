namespace AyVino.Api.Common.Exceptions;

public class PayloadTooLargeException(string message)
    : AppException(message, StatusCodes.Status413PayloadTooLarge);

