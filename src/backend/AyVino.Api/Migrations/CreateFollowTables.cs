using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260929003)]
public class M20260929003_CreateFollowTables : Migration
{
    public override void Up()
    {
        // ---------- user_follows ----------
        Create.Table("user_follows")
            .WithColumn("follower_id").AsInt32().NotNullable()
            .WithColumn("followed_user_id").AsInt32().NotNullable()
            .WithColumn("created_at").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime);

        Create.PrimaryKey("pk_user_follows")
            .OnTable("user_follows").Columns("follower_id", "followed_user_id");

        Create.ForeignKey("fk_user_follows_follower")
            .FromTable("user_follows").ForeignColumn("follower_id")
            .ToTable("users").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.ForeignKey("fk_user_follows_followed")
            .FromTable("user_follows").ForeignColumn("followed_user_id")
            .ToTable("users").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Execute.Sql("ALTER TABLE user_follows ADD CONSTRAINT ck_user_follows_no_self CHECK (follower_id <> followed_user_id);");

        Create.Index("ix_user_follows_followed_user_id")
            .OnTable("user_follows").OnColumn("followed_user_id");

        // ---------- winery_follows ----------
        Create.Table("winery_follows")
            .WithColumn("follower_id").AsInt32().NotNullable()
            .WithColumn("winery_id").AsInt32().NotNullable()
            .WithColumn("created_at").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime);

        Create.PrimaryKey("pk_winery_follows")
            .OnTable("winery_follows").Columns("follower_id", "winery_id");

        Create.ForeignKey("fk_winery_follows_follower")
            .FromTable("winery_follows").ForeignColumn("follower_id")
            .ToTable("users").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.ForeignKey("fk_winery_follows_winery")
            .FromTable("winery_follows").ForeignColumn("winery_id")
            .ToTable("wineries").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.Index("ix_winery_follows_winery_id")
            .OnTable("winery_follows").OnColumn("winery_id");
    }

    public override void Down()
    {
        Delete.Table("winery_follows");
        Delete.Table("user_follows");
    }
}