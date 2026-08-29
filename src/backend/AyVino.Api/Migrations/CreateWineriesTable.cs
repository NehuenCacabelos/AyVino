using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260829003)]
public class M20260829003_CreateWineriesTable : Migration
{
    public override void Up()
    {
        Create.Table("Wineries")
            .WithColumn("Id").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("Name").AsString(100).NotNullable()
            .WithColumn("Description").AsString(1000).Nullable()
            .WithColumn("LocationId").AsInt32().NotNullable()
            .WithColumn("FoundationYear").AsInt32().Nullable()
            .WithColumn("Website").AsString(200).Nullable()
            .WithColumn("UserId").AsInt32().Nullable()
            .WithColumn("Status").AsInt16().NotNullable()
            .WithColumn("RegisterDate").AsDateTime().NotNullable();

        Create.ForeignKey("FK_Wineries_Locations")
            .FromTable("Wineries").ForeignColumn("LocationId")
            .ToTable("Locations").PrimaryColumn("Id");

        // Nullable on purpose: an "unclaimed" winery (see design in handoff)
        Create.ForeignKey("FK_Wineries_Users")
            .FromTable("Wineries").ForeignColumn("UserId")
            .ToTable("Users").PrimaryColumn("Id")
            .OnDelete(Rule.SetNull);

        Create.Index("IX_Wineries_UserId")
            .OnTable("Wineries")
            .OnColumn("UserId").Ascending();
    }

    public override void Down()
    {
        Delete.ForeignKey("FK_Wineries_Users");
        Delete.ForeignKey("FK_Wineries_Locations");
        Delete.Table("Wineries");
    }
}