using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261031003)]
public class M20261031003_CreateUserActivitiesTable : Migration
{
    public override void Up()
    {
        Create.Table("user_activities")
            .WithColumn("id").AsInt64().PrimaryKey().Identity()
            .WithColumn("user_id").AsInt32().NotNullable()
            .WithColumn("type").AsInt16().NotNullable()
            .WithColumn("wine_id").AsInt32().NotNullable()
            .WithColumn("wine_vintage_id").AsInt32().Nullable()
            .WithColumn("occurred_at").AsCustom("timestamptz").NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime);

        Create.ForeignKey("FK_UserActivities_Users")
            .FromTable("user_activities").ForeignColumn("user_id")
            .ToTable("users").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.ForeignKey("FK_UserActivities_Wines")
            .FromTable("user_activities").ForeignColumn("wine_id")
            .ToTable("wines").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.ForeignKey("FK_UserActivities_WineVintages")
            .FromTable("user_activities").ForeignColumn("wine_vintage_id")
            .ToTable("wine_vintages").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.Index("ix_user_activities_user_occurred_at")
            .OnTable("user_activities")
            .OnColumn("user_id").Ascending()
            .OnColumn("occurred_at").Descending();
    }

    public override void Down()
    {
        Delete.Table("user_activities");
    }
}
