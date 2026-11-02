namespace AyVino.Api.Features.WineryCatalog.Repositories;

/// <summary>
/// Reusable SQL fragments for winery location and public catalog metrics (totals, followers).
/// Ensures identical business logic across winery public profiles and user following lists.
/// </summary>
public static class WineryCatalogSqlFragments
{
    public const string LocationJoins = """
        LEFT JOIN locations l ON l.id = {0}.location_id
        LEFT JOIN cities c ON c.id = l.city_id
        LEFT JOIN states s ON s.id = c.state_id
        """;

    public const string ApprovedWineryLabelsCountSubquery = """
        SELECT COUNT(DISTINCT w_in.id)
        FROM wines w_in
        INNER JOIN wine_vintages v_in ON v_in.wine_id = w_in.id
        WHERE w_in.winery_id = {0}.id
          AND w_in.duplicate_of_wine_id IS NULL
          AND v_in.approval_status = 2
        """;

    public const string FollowersCountSubquery = """
        SELECT COUNT(*)
        FROM winery_follows wf_in
        WHERE wf_in.winery_id = {0}.id
          AND ({0}.user_id IS NULL OR wf_in.follower_id != {0}.user_id)
        """;
}
