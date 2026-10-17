using System.Data;
using AyVino.Api.Common.Data;
using NSubstitute;

namespace AyVino.UnitTests.Common;

public class DateOnlyTypeHandlerTests
{
    private readonly DateOnlyTypeHandler _handler = new();

    [Fact]
    public void SetValue_SetsParameterDbTypeAndDateTimeValue()
    {
        var parameter = Substitute.For<IDbDataParameter>();
        var date = new DateOnly(2026, 10, 17);

        _handler.SetValue(parameter, date);

        parameter.Received(1).DbType = DbType.Date;
        parameter.Received(1).Value = new DateTime(2026, 10, 17, 0, 0, 0);
    }

    [Fact]
    public void Parse_WithDateOnly_ReturnsSameDateOnly()
    {
        var expected = new DateOnly(2026, 10, 17);

        var result = _handler.Parse(expected);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Parse_WithDateTime_ReturnsConvertedDateOnly()
    {
        var dateTime = new DateTime(2026, 10, 17, 14, 30, 0);
        var expected = new DateOnly(2026, 10, 17);

        var result = _handler.Parse(dateTime);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Parse_WithNull_ReturnsDefaultDateOnly()
    {
        var result = _handler.Parse(null);

        Assert.Equal(default, result);
    }

    [Fact]
    public void Parse_WithDBNull_ReturnsDefaultDateOnly()
    {
        var result = _handler.Parse(DBNull.Value);

        Assert.Equal(default, result);
    }

    [Fact]
    public void Parse_WithValidDateString_ReturnsParsedDateOnly()
    {
        var result = _handler.Parse("2026-10-17");

        Assert.Equal(new DateOnly(2026, 10, 17), result);
    }

    [Fact]
    public void Parse_WithInvalidString_ThrowsFormatException()
    {
        Assert.Throws<FormatException>(() => _handler.Parse("not-a-date"));
    }
}
