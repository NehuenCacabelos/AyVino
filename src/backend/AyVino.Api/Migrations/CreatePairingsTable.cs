using FluentMigrator;
using System.Data;

namespace AyVino.Api.Migrations;

[Migration(20260919001)]
public class M20260919001_CreatePairingsTable : Migration
{
    public override void Up()
    {
        Create.Table("pairings")
            .WithColumn("id").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("name").AsString(100).NotNullable()
            .WithColumn("category").AsInt16().NotNullable();

        Create.Table("wine_pairings")
            .WithColumn("wine_id").AsInt32().NotNullable()
            .WithColumn("pairing_id").AsInt32().NotNullable();

        Create.PrimaryKey("PK_WinePairings").OnTable("wine_pairings").Columns("wine_id", "pairing_id");

        Create.ForeignKey("FK_WinePairings_Wines")
            .FromTable("wine_pairings").ForeignColumn("wine_id")
            .ToTable("wines").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.ForeignKey("FK_WinePairings_Pairings")
            .FromTable("wine_pairings").ForeignColumn("pairing_id")
            .ToTable("pairings").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);
    }

    public override void Down()
    {
        Delete.ForeignKey("FK_WinePairings_Pairings").OnTable("wine_pairings");
        Delete.ForeignKey("FK_WinePairings_Wines").OnTable("wine_pairings");
        Delete.Table("wine_pairings");
        Delete.Table("pairings");
    }
}