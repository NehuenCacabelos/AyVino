using System.ComponentModel.DataAnnotations;

namespace AyVino.UnitTests.Validation;

internal static class ValidationTestHelper
{
    public static List<ValidationResult> Validate(object dto)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, new ValidationContext(dto), results, validateAllProperties: true);
        return results;
    }

    public static bool HasErrorFor(IEnumerable<ValidationResult> results, string member)
        => results.Any(r => r.MemberNames.Contains(member));
}
