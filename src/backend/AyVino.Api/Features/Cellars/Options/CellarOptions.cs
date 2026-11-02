namespace AyVino.Api.Features.Cellars.Options;

public class CellarOptions
{
    public const string SectionName = "Cellars";
    public int MaxPerUser { get; set; } = 3;
}
