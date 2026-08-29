using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260829004)]
public class M20260829004_CreateGrapesTable : Migration
{
    public override void Up()
    {
        Create.Table("Grapes")
            .WithColumn("Id").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("Name").AsString(100).NotNullable()
            .WithColumn("ColorType").AsInt16().NotNullable()
            .WithColumn("TypicalBody").AsInt16().Nullable()
            .WithColumn("TypicalTannins").AsInt16().Nullable()
            .WithColumn("TypicalAcidity").AsInt16().Nullable()
            .WithColumn("Description").AsString(1000).Nullable();
    }

    public override void Down()
    {
        Delete.Table("Grapes");
    }
}