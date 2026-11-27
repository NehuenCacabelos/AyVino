using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261022005)]
public class AddLogoUrlToWineries : Migration
{
    public override void Up()
    {
        Alter.Table("wineries")
            .AddColumn("logo_url").AsString(500).Nullable();
    }

    public override void Down()
    {
        Delete.Column("logo_url").FromTable("wineries");
    }
}

