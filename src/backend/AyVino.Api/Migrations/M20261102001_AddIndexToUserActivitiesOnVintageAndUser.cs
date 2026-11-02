using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261102001)]
public class M20261102001_AddIndexToUserActivitiesOnVintageAndUser : Migration
{
    public override void Up()
    {
        Create.Index("ix_user_activities_wine_vintage_id_user_id")
            .OnTable("user_activities")
            .OnColumn("wine_vintage_id").Ascending()
            .OnColumn("user_id").Ascending();
    }

    public override void Down()
    {
        Delete.Index("ix_user_activities_wine_vintage_id_user_id")
            .OnTable("user_activities");
    }
}
