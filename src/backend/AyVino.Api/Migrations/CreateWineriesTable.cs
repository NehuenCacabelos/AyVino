using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260829003)]
public class M20260829003_CreateWineriesTable : Migration
{
    public override void Up()
    {
        Create.Table("wineries")
            .WithColumn("id").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("name").AsString(100).NotNullable()
            .WithColumn("description").AsString(1000).Nullable()
            .WithColumn("locationid").AsInt32().NotNullable()
            .WithColumn("foundationyear").AsInt32().Nullable()
            .WithColumn("website").AsString(200).Nullable()
            .WithColumn("userid").AsInt32().Nullable()
            .WithColumn("status").AsInt16().NotNullable()
            .WithColumn("registerdate").AsDateTime().NotNullable();

        Create.ForeignKey("FK_Wineries_Locations")
            .FromTable("wineries").ForeignColumn("locationid")
            .ToTable("locations").PrimaryColumn("id");

        // Nullable on purpose: an "unclaimed" winery (see design in handoff)
        Create.ForeignKey("FK_Wineries_Users")
            .FromTable("wineries").ForeignColumn("userid")
            .ToTable("users").PrimaryColumn("id")
            .OnDelete(Rule.SetNull);

        Create.Index("IX_Wineries_UserId")
            .OnTable("wineries")
            .OnColumn("userid").Ascending();
    }

    public override void Down()
    {
        Delete.ForeignKey("FK_Wineries_Users");
        Delete.ForeignKey("FK_Wineries_Locations");
        Delete.Table("wineries");
    }
}