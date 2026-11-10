using System.ComponentModel.DataAnnotations;
using AyVino.Api.Features.Reviews.DTOs;

namespace AyVino.UnitTests.Validation;

public class ReviewDtoValidationTests
{
    private static CreateReviewRequestDto ValidCreateReview() => new(
        WineVintageId: 1,
        Rating: 5,
        Comment: "Excelente vino con gran persistencia en boca."
    );

    private static UpdateReviewRequestDto ValidUpdateReview() => new(
        Rating: 4,
        Comment: "Muy buen vino."
    );

    [Fact]
    public void CreateReviewRequestDto_Valid_PassesValidation()
    {
        var dto = ValidCreateReview();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(-1, false)]
    [InlineData(1, true)]
    [InlineData(int.MaxValue, true)]
    public void CreateReviewRequestDto_WineVintageId_Range(int vintageId, bool expectedValid)
    {
        var dto = ValidCreateReview() with { WineVintageId = vintageId };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(CreateReviewRequestDto.WineVintageId));
        Assert.Equal(!expectedValid, hasError);
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(1, true)]
    [InlineData(5, true)]
    [InlineData(6, false)]
    public void CreateReviewRequestDto_Rating_Range(int rating, bool expectedValid)
    {
        var dto = ValidCreateReview() with { Rating = rating };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(CreateReviewRequestDto.Rating));
        Assert.Equal(!expectedValid, hasError);
    }

    [Fact]
    public void CreateReviewRequestDto_Comment_LengthBoundaries()
    {
        var valid = ValidCreateReview() with { Comment = new string('a', 1000) };
        Assert.Empty(ValidationTestHelper.Validate(valid));

        var invalid = ValidCreateReview() with { Comment = new string('a', 1001) };
        var results = ValidationTestHelper.Validate(invalid);
        Assert.True(ValidationTestHelper.HasErrorFor(results, nameof(CreateReviewRequestDto.Comment)));
    }

    [Fact]
    public void CreateReviewRequestDto_ErrorMessage_IsSpanish()
    {
        var dto = new CreateReviewRequestDto(0, 9, null);
        var results = ValidationTestHelper.Validate(dto);
        Assert.Contains(results, r => r.ErrorMessage == "El id de la cosecha debe ser mayor a 0.");
        Assert.Contains(results, r => r.ErrorMessage == "El rating debe estar entre 1 y 5.");
    }

    [Fact]
    public void UpdateReviewRequestDto_Valid_PassesValidation()
    {
        var dto = ValidUpdateReview();
        var results = ValidationTestHelper.Validate(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(1, true)]
    [InlineData(5, true)]
    [InlineData(6, false)]
    public void UpdateReviewRequestDto_Rating_Range(int rating, bool expectedValid)
    {
        var dto = ValidUpdateReview() with { Rating = rating };
        var results = ValidationTestHelper.Validate(dto);
        var hasError = ValidationTestHelper.HasErrorFor(results, nameof(UpdateReviewRequestDto.Rating));
        Assert.Equal(!expectedValid, hasError);
    }
}
