using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260830002)]
public class M20260830002_CreateWinesTable : Migration
{
    public override void Up()
    {
        // wines = la etiqueta (lo que no cambia entre cosechas: nombre, bodega, estilo, región).
        Create.Table("wines")
            .WithColumn("id").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("winery_id").AsInt32().Nullable()
            .WithColumn("winery_name_text").AsString(150).Nullable()
            .WithColumn("name").AsString(150).NotNullable()
            .WithColumn("description").AsString(1000).Nullable()
            .WithColumn("wine_type").AsInt16().NotNullable()
            .WithColumn("location_id").AsInt32().Nullable()
            .WithColumn("source_type").AsInt16().NotNullable().WithDefaultValue(1) // 1 = Community
            .WithColumn("duplicate_of_wine_id").AsInt32().Nullable()
            .WithColumn("rating_sum").AsInt32().NotNullable().WithDefaultValue(0)
            .WithColumn("review_count").AsInt32().NotNullable().WithDefaultValue(0);

        Create.ForeignKey("FK_Wines_Wineries")
            .FromTable("wines").ForeignColumn("winery_id")
            .ToTable("wineries").PrimaryColumn("id")
            .OnDelete(Rule.SetNull);

        Create.ForeignKey("FK_Wines_Locations")
            .FromTable("wines").ForeignColumn("location_id")
            .ToTable("locations").PrimaryColumn("id")
            .OnDelete(Rule.SetNull);

        // Self-FK para Pieza C (merge de duplicados), todavía sin endpoint que la use.
        Create.ForeignKey("FK_Wines_Wines_DuplicateOf")
            .FromTable("wines").ForeignColumn("duplicate_of_wine_id")
            .ToTable("wines").PrimaryColumn("id")
            .OnDelete(Rule.SetNull);

        Create.Index("IX_Wines_WineryId").OnTable("wines").OnColumn("winery_id").Ascending();
        Create.Index("IX_Wines_LocationId").OnTable("wines").OnColumn("location_id").Ascending();
        Create.Index("IX_Wines_WineryNameText").OnTable("wines").OnColumn("winery_name_text").Ascending();

        // wine_vintages = la cosecha (lo que sí cambia año a año: foto, alcohol, moderación, rating propio).
        Create.Table("wine_vintages")
            .WithColumn("id").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("wine_id").AsInt32().NotNullable()
            .WithColumn("year").AsInt32().Nullable()
            .WithColumn("alcohol_content").AsDecimal(4, 2).Nullable()
            .WithColumn("serving_temperature").AsInt32().Nullable()
            .WithColumn("aging_advice").AsString(500).Nullable()
            .WithColumn("image_url").AsString(300).Nullable()
            .WithColumn("approval_status").AsInt16().NotNullable()
            .WithColumn("uploaded_by_user_id").AsInt32().NotNullable()
            .WithColumn("register_date").AsDateTime().NotNullable()
            .WithColumn("rating_sum").AsInt32().NotNullable().WithDefaultValue(0)
            .WithColumn("review_count").AsInt32().NotNullable().WithDefaultValue(0);

        Create.ForeignKey("FK_WineVintages_Wines")
            .FromTable("wine_vintages").ForeignColumn("wine_id")
            .ToTable("wines").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.ForeignKey("FK_WineVintages_Users")
            .FromTable("wine_vintages").ForeignColumn("uploaded_by_user_id")
            .ToTable("users").PrimaryColumn("id");

        Create.Index("IX_WineVintages_WineId").OnTable("wine_vintages").OnColumn("wine_id").Ascending();

        // FluentMigrator no tiene soporte fluent para "NULLS NOT DISTINCT" (Postgres 15+).
        // Evita dos cosechas "sin añada" (year=null) para la misma etiqueta.
        Execute.Sql("""
            ALTER TABLE wine_vintages
            ADD CONSTRAINT "UQ_WineVintages_WineId_Year" UNIQUE NULLS NOT DISTINCT (wine_id, year);
            """);

        // wine_grapes cuelga de la COSECHA, no de la etiqueta: el corte puede variar de año a año.
        Create.Table("wine_grapes")
            .WithColumn("wine_vintage_id").AsInt32().NotNullable()
            .WithColumn("grape_id").AsInt32().NotNullable()
            .WithColumn("percentage").AsDecimal(5, 2).Nullable();

        Create.PrimaryKey("PK_WineGrapes").OnTable("wine_grapes").Columns("wine_vintage_id", "grape_id");

        Create.ForeignKey("FK_WineGrapes_WineVintages")
            .FromTable("wine_grapes").ForeignColumn("wine_vintage_id")
            .ToTable("wine_vintages").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.ForeignKey("FK_WineGrapes_Grapes")
            .FromTable("wine_grapes").ForeignColumn("grape_id")
            .ToTable("grapes").PrimaryColumn("id");

        // Regla legal (INV/UE/EEUU): <=100%, no exactamente 100%, por blends encubiertos
        // y "otras uvas" no declaradas.
        Execute.Sql("""
            ALTER TABLE wine_grapes
            ADD CONSTRAINT "CK_WineGrapes_Percentage" CHECK (percentage IS NULL OR (percentage > 0 AND percentage <= 100));
            """);
    }

    public override void Down()
    {
        Delete.ForeignKey("FK_WineGrapes_Grapes").OnTable("wine_grapes");
        Delete.ForeignKey("FK_WineGrapes_WineVintages").OnTable("wine_grapes");
        Delete.Table("wine_grapes");

        Execute.Sql("ALTER TABLE wine_vintages DROP CONSTRAINT \"UQ_WineVintages_WineId_Year\";");
        Delete.Index("IX_WineVintages_WineId").OnTable("wine_vintages");
        Delete.ForeignKey("FK_WineVintages_Users").OnTable("wine_vintages");
        Delete.ForeignKey("FK_WineVintages_Wines").OnTable("wine_vintages");
        Delete.Table("wine_vintages");

        Delete.Index("IX_Wines_WineryNameText").OnTable("wines");
        Delete.Index("IX_Wines_LocationId").OnTable("wines");
        Delete.Index("IX_Wines_WineryId").OnTable("wines");
        Delete.ForeignKey("FK_Wines_Wines_DuplicateOf").OnTable("wines");
        Delete.ForeignKey("FK_Wines_Locations").OnTable("wines");
        Delete.ForeignKey("FK_Wines_Wineries").OnTable("wines");
        Delete.Table("wines");
    }
}