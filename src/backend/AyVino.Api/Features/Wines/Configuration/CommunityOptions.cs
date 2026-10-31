namespace AyVino.Api.Features.Wines.Configuration;

public class CommunityOptions
{
    public const string SectionName = "Community";
    public int MinUsersForPublicVisibility { get; set; } = 2;
}
