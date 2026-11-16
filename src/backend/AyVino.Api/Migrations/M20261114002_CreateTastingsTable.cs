using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261114002)]
public class M20261114002_CreateTastingsTable : Migration
{
    public override void Up()
    {
        Create.Table("tastings")
            .WithColumn("id").AsInt32().PrimaryKey().Identity()
            .WithColumn("user_id").AsInt32().NotNullable().ForeignKey("users", "id")
            .WithColumn("wine_vintage_id").AsInt32().NotNullable().ForeignKey("wine_vintages", "id")
            .WithColumn("cellar_id").AsInt32().Nullable().ForeignKey("cellars", "id").OnDelete(Rule.SetNull)
            .WithColumn("rating").AsCustom("numeric(2,1)").Nullable()
            .WithColumn("comment").AsString(1000).Nullable()
            .WithColumn("tasted_at").AsCustom("timestamptz").NotNullable()
            .WithColumn("created_at").AsCustom("timestamptz").NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime);

        Execute.Sql("ALTER TABLE tastings ADD CONSTRAINT ck_tastings_rating_range CHECK (rating IS NULL OR (rating >= 1.0 AND rating <= 5.0));");

        Create.Index("ix_tastings_user_id_tasted_at")
            .OnTable("tastings")
            .OnColumn("user_id").Ascending()
            .OnColumn("tasted_at").Descending();
    }

    public override void Down()
    {
        Delete.Table("tastings");
    }
}
