using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261004001)]
public class M20261004001_CreateUserWinesTable : Migration
{
    public override void Up()
    {
        Create.Table("user_wines")
            .WithColumn("user_id").AsInt32().NotNullable()
            .WithColumn("wine_id").AsInt32().NotNullable()
            .WithColumn("is_wanted").AsBoolean().NotNullable().WithDefaultValue(false)
            .WithColumn("is_tried").AsBoolean().NotNullable().WithDefaultValue(false)
            .WithColumn("is_favorite").AsBoolean().NotNullable().WithDefaultValue(false)
            .WithColumn("created_at").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime)
            .WithColumn("updated_at").AsDateTime().Nullable();

        // Una sola fila por usuario y vino.
        Create.PrimaryKey("pk_user_wines")
            .OnTable("user_wines").Columns("user_id", "wine_id");

        Create.ForeignKey("fk_user_wines_user")
            .FromTable("user_wines").ForeignColumn("user_id")
            .ToTable("users").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.ForeignKey("fk_user_wines_wine")
            .FromTable("user_wines").ForeignColumn("wine_id")
            .ToTable("wines").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.Index("ix_user_wines_wine_id")
            .OnTable("user_wines").OnColumn("wine_id");

        // Una fila sin ninguna marca no tiene sentido: tiene que borrarse.
        Execute.Sql("ALTER TABLE user_wines ADD CONSTRAINT ck_user_wines_any_mark CHECK (is_wanted OR is_tried OR is_favorite);");
    }

    public override void Down()
    {
        Delete.Table("user_wines");
    }
}