using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260830003)]
public class M20260830003_AddWineClaimFields : Migration
{
    public override void Up()
    {
        Alter.Table("wines")
            .AddColumn("winery_name_text").AsString(150).Nullable()
            .AddColumn("source_type").AsInt16().NotNullable().WithDefaultValue(1) // 1 = Community
            .AddColumn("duplicate_of_wine_id").AsInt32().Nullable();

        // Self-FK: soporte para Pieza C (merge de duplicados), todavía sin endpoint que la use.
        Create.ForeignKey("FK_Wines_Wines_DuplicateOf")
            .FromTable("wines").ForeignColumn("duplicate_of_wine_id")
            .ToTable("wines").PrimaryColumn("id")
            .OnDelete(Rule.SetNull);

        Create.Index("IX_Wines_WineryNameText").OnTable("wines").OnColumn("winery_name_text").Ascending();
    }

    public override void Down()
    {
        Delete.Index("IX_Wines_WineryNameText").OnTable("wines");
        Delete.ForeignKey("FK_Wines_Wines_DuplicateOf").OnTable("wines");
        Delete.Column("winery_name_text").FromTable("wines");
        Delete.Column("source_type").FromTable("wines");
        Delete.Column("duplicate_of_wine_id").FromTable("wines");
    }
}