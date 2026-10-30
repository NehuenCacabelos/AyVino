using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261029003)]
public class M20261029003_RemoveLegacyImageColumns : Migration
{
    public override void Up()
    {
        Delete.Column("photo").FromTable("users");
        Delete.Column("logo_url").FromTable("wineries");
        Delete.Column("banner_url").FromTable("wineries");
        Delete.Column("image_url").FromTable("wine_vintages");
    }

    public override void Down()
    {
        Alter.Table("users")
            .AddColumn("photo").AsString(100).Nullable();

        Alter.Table("wineries")
            .AddColumn("logo_url").AsString(500).Nullable();

        Alter.Table("wineries")
            .AddColumn("banner_url").AsString(500).Nullable();

        Alter.Table("wine_vintages")
            .AddColumn("image_url").AsString(300).Nullable();
    }
}
