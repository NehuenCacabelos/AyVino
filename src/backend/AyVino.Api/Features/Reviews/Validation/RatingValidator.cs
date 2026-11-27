using System.ComponentModel.DataAnnotations;
using AyVinoValidationException = AyVino.Api.Common.Exceptions.ValidationException;

namespace AyVino.Api.Features.Reviews.Validation;

public static class RatingValidator
{
    public const decimal MinRating = 1.0m;
    public const decimal MaxRating = 5.0m;

    public static void Validate(decimal rating)
    {
        if (rating < MinRating || rating > MaxRating)
        {
            throw new AyVinoValidationException("El rating debe estar entre 1 y 5.");
        }

        // Verifica que no tenga más de un decimal.
        // rating * 10 debe ser un número entero (sin parte fraccionaria).
        if (decimal.Remainder(rating * 10m, 1m) != 0m)
        {
            throw new AyVinoValidationException("El rating solo puede tener un decimal.");
        }
    }

    public static decimal Normalize(decimal rating)
    {
        Validate(rating);
        return decimal.Round(rating, 1) + 0.0m;
    }
}

public class ValidRatingAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is null) return ValidationResult.Success;

        var memberNames = validationContext.MemberName != null ? new[] { validationContext.MemberName } : Array.Empty<string>();

        decimal dec;
        if (value is decimal d) dec = d;
        else if (value is int i) dec = i;
        else if (value is double dbl) dec = (decimal)dbl;
        else return new ValidationResult("El rating debe ser un número decimal válido.", memberNames);

        try
        {
            RatingValidator.Validate(dec);
            return ValidationResult.Success;
        }
        catch (AyVinoValidationException ex)
        {
            return new ValidationResult(ex.Message, memberNames);
        }
    }
}
