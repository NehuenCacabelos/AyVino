using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260830002)]
public class M20260830002_CreateWinesTable : Migration
{
    public override void Up()
    {
        Create.Table("wines")
            .WithColumn("id").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("winery_id").AsInt32().Nullable()
            .WithColumn("name").AsString(150).NotNullable()
            .WithColumn("description").AsString(1000).Nullable()
            .WithColumn("wine_type").AsInt16().NotNullable()
            .WithColumn("location_id").AsInt32().Nullable()
            .WithColumn("year").AsInt32().Nullable()
            .WithColumn("alcohol_content").AsDecimal(4, 2).Nullable()
            .WithColumn("serving_temperature").AsInt32().Nullable()
            .WithColumn("aging_advice").AsString(500).Nullable()
            .WithColumn("label_image_url").AsString(300).Nullable()
            .WithColumn("approval_status").AsInt16().NotNullable()
            .WithColumn("uploaded_by_user_id").AsInt32().NotNullable()
            .WithColumn("register_date").AsDateTime().NotNullable();

        // Nullable a propósito, mismo criterio que wineries.user_id: vino "de la comunidad" sin bodega oficial.
        Create.ForeignKey("FK_Wines_Wineries")
            .FromTable("wines").ForeignColumn("winery_id")
            .ToTable("wineries").PrimaryColumn("id")
            .OnDelete(Rule.SetNull);

        Create.ForeignKey("FK_Wines_Locations")
            .FromTable("wines").ForeignColumn("location_id")
            .ToTable("locations").PrimaryColumn("id")
            .OnDelete(Rule.SetNull);

        Create.ForeignKey("FK_Wines_Users")
            .FromTable("wines").ForeignColumn("uploaded_by_user_id")
            .ToTable("users").PrimaryColumn("id");

        Create.Index("IX_Wines_WineryId").OnTable("wines").OnColumn("winery_id").Ascending();
        Create.Index("IX_Wines_LocationId").OnTable("wines").OnColumn("location_id").Ascending();

        Create.Table("wine_grapes")
            .WithColumn("wine_id").AsInt32().NotNullable()
            .WithColumn("grape_id").AsInt32().NotNullable()
            .WithColumn("percentage").AsDecimal(5, 2).Nullable();

        Create.PrimaryKey("PK_WineGrapes").OnTable("wine_grapes").Columns("wine_id", "grape_id");

        Create.ForeignKey("FK_WineGrapes_Wines")
            .FromTable("wine_grapes").ForeignColumn("wine_id")
            .ToTable("wines").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.ForeignKey("FK_WineGrapes_Grapes")
            .FromTable("wine_grapes").ForeignColumn("grape_id")
            .ToTable("grapes").PrimaryColumn("id");

        // Regla de negocio de la consigna: el porcentaje tiene que ser una porción real del corte, no 0 ni más de 100.
        Execute.Sql("ALTER TABLE wine_grapes ADD CONSTRAINT \"CK_WineGrapes_Percentage\" CHECK (percentage IS NULL OR (percentage > 0 AND percentage <= 100));");
    }

    public override void Down()
    {
        Delete.ForeignKey("FK_WineGrapes_Grapes").OnTable("wine_grapes");
        Delete.ForeignKey("FK_WineGrapes_Wines").OnTable("wine_grapes");
        Delete.Table("wine_grapes");

        Delete.Index("IX_Wines_LocationId").OnTable("wines");
        Delete.Index("IX_Wines_WineryId").OnTable("wines");
        Delete.ForeignKey("FK_Wines_Users").OnTable("wines");
        Delete.ForeignKey("FK_Wines_Locations").OnTable("wines");
        Delete.ForeignKey("FK_Wines_Wineries").OnTable("wines");
        Delete.Table("wines");
    }
}