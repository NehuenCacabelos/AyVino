using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261027001)]
public class AddBannerUrlToWineries : Migration
{
    public override void Up()
    {
        Alter.Table("wineries")
            .AddColumn("banner_url").AsString(500).Nullable();
    }

    public override void Down()
    {
        Delete.Column("banner_url").FromTable("wineries");
    }
}
