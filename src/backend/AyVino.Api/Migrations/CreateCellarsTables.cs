using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261005003)]
public class M20261005003_CreateCellarsTables : Migration
{
    public override void Up()
    {
        // cellars = cada cava del usuario (Casa, Depto, ...).
        Create.Table("cellars")
            .WithColumn("id").AsInt32().PrimaryKey().Identity()
            .WithColumn("user_id").AsInt32().NotNullable()
            .WithColumn("name").AsString(100).NotNullable()
            .WithColumn("created_at").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime)
            .WithColumn("updated_at").AsDateTime().Nullable();

        Create.ForeignKey("fk_cellars_user")
            .FromTable("cellars").ForeignColumn("user_id")
            .ToTable("users").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        // Nombre único por usuario sin distinguir mayúsculas ("Casa" = "casa").
        Execute.Sql("CREATE UNIQUE INDEX uq_cellars_user_name ON cellars (user_id, lower(name));");

        // cellar_items = una fila por cosecha dentro de cada cava.
        Create.Table("cellar_items")
            .WithColumn("cellar_id").AsInt32().NotNullable()
            .WithColumn("wine_vintage_id").AsInt32().NotNullable()
            .WithColumn("quantity").AsInt32().NotNullable()
            .WithColumn("purchase_date").AsDate().Nullable()
            .WithColumn("notes").AsString(500).Nullable()
            .WithColumn("created_at").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime)
            .WithColumn("updated_at").AsDateTime().Nullable();

        Create.PrimaryKey("pk_cellar_items")
            .OnTable("cellar_items").Columns("cellar_id", "wine_vintage_id");

        Create.ForeignKey("fk_cellar_items_cellar")
            .FromTable("cellar_items").ForeignColumn("cellar_id")
            .ToTable("cellars").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.ForeignKey("fk_cellar_items_wine_vintage")
            .FromTable("cellar_items").ForeignColumn("wine_vintage_id")
            .ToTable("wine_vintages").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.Index("ix_cellar_items_wine_vintage_id")
            .OnTable("cellar_items").OnColumn("wine_vintage_id");

        Execute.Sql("ALTER TABLE cellar_items ADD CONSTRAINT ck_cellar_items_quantity CHECK (quantity >= 1 AND quantity <= 999);");
    }

    public override void Down()
    {
        Delete.Table("cellar_items");
        Delete.Table("cellars");
    }
}