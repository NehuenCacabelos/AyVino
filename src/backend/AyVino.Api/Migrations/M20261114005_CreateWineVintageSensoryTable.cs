using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261114005)]
public class M20261114005_CreateWineVintageSensoryTable : Migration
{
    public override void Up()
    {
        Create.Table("wine_vintage_sensory")
            .WithColumn("wine_vintage_id").AsInt32().PrimaryKey()
            .WithColumn("body").AsDecimal(2, 1).Nullable()
            .WithColumn("tannins").AsDecimal(2, 1).Nullable()
            .WithColumn("acidity").AsDecimal(2, 1).Nullable()
            .WithColumn("fruit").AsDecimal(2, 1).Nullable()
            .WithColumn("oak").AsDecimal(2, 1).Nullable()
            .WithColumn("persistence").AsDecimal(2, 1).Nullable()
            .WithColumn("updated_at").AsCustom("timestamptz").NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        Create.ForeignKey("FK_WineVintageSensory_WineVintages")
            .FromTable("wine_vintage_sensory").ForeignColumn("wine_vintage_id")
            .ToTable("wine_vintages").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Execute.Sql("""
            ALTER TABLE wine_vintage_sensory
            ADD CONSTRAINT "CK_WineVintageSensory_Body" CHECK (body IS NULL OR (body >= 1.0 AND body <= 5.0)),
            ADD CONSTRAINT "CK_WineVintageSensory_Tannins" CHECK (tannins IS NULL OR (tannins >= 1.0 AND tannins <= 5.0)),
            ADD CONSTRAINT "CK_WineVintageSensory_Acidity" CHECK (acidity IS NULL OR (acidity >= 1.0 AND acidity <= 5.0)),
            ADD CONSTRAINT "CK_WineVintageSensory_Fruit" CHECK (fruit IS NULL OR (fruit >= 1.0 AND fruit <= 5.0)),
            ADD CONSTRAINT "CK_WineVintageSensory_Oak" CHECK (oak IS NULL OR (oak >= 1.0 AND oak <= 5.0)),
            ADD CONSTRAINT "CK_WineVintageSensory_Persistence" CHECK (persistence IS NULL OR (persistence >= 1.0 AND persistence <= 5.0));
            """);
    }

    public override void Down()
    {
        Delete.Table("wine_vintage_sensory");
    }
}
