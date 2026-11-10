using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261029002)]
public class M20261029002_AddImageReferencesToEntities : Migration
{
    public override void Up()
    {
        Alter.Table("users")
            .AddColumn("avatar_image_id").AsGuid().Nullable();

        Create.ForeignKey("fk_users_avatar_image_id")
            .FromTable("users").ForeignColumn("avatar_image_id")
            .ToTable("images").PrimaryColumn("id")
            .OnDelete(Rule.SetNull);

        Alter.Table("wineries")
            .AddColumn("logo_image_id").AsGuid().Nullable();

        Create.ForeignKey("fk_wineries_logo_image_id")
            .FromTable("wineries").ForeignColumn("logo_image_id")
            .ToTable("images").PrimaryColumn("id")
            .OnDelete(Rule.SetNull);

        Alter.Table("wineries")
            .AddColumn("banner_image_id").AsGuid().Nullable();

        Create.ForeignKey("fk_wineries_banner_image_id")
            .FromTable("wineries").ForeignColumn("banner_image_id")
            .ToTable("images").PrimaryColumn("id")
            .OnDelete(Rule.SetNull);

        Alter.Table("wine_vintages")
            .AddColumn("image_id").AsGuid().Nullable();

        Create.ForeignKey("fk_wine_vintages_image_id")
            .FromTable("wine_vintages").ForeignColumn("image_id")
            .ToTable("images").PrimaryColumn("id")
            .OnDelete(Rule.SetNull);
    }

    public override void Down()
    {
        Delete.ForeignKey("fk_wine_vintages_image_id").OnTable("wine_vintages");
        Delete.Column("image_id").FromTable("wine_vintages");

        Delete.ForeignKey("fk_wineries_banner_image_id").OnTable("wineries");
        Delete.Column("banner_image_id").FromTable("wineries");

        Delete.ForeignKey("fk_wineries_logo_image_id").OnTable("wineries");
        Delete.Column("logo_image_id").FromTable("wineries");

        Delete.ForeignKey("fk_users_avatar_image_id").OnTable("users");
        Delete.Column("avatar_image_id").FromTable("users");
    }
}
