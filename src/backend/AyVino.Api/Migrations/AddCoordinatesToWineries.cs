using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261022003)]
public class M20261022003_AddCoordinatesToWineries : Migration
{
    public override void Up()
    {
        Alter.Table("wineries")
            .AddColumn("latitude").AsDecimal(10, 7).Nullable()
            .AddColumn("longitude").AsDecimal(10, 7).Nullable();
    }

    public override void Down()
    {
        Delete.Column("longitude").FromTable("wineries");
        Delete.Column("latitude").FromTable("wineries");
    }
}

