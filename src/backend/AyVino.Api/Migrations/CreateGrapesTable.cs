using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260829004)]
public class M20260829004_CreateGrapesTable : Migration
{
    public override void Up()
    {
        Create.Table("grapes")
            .WithColumn("id").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("name").AsString(100).NotNullable()
            .WithColumn("colortype").AsInt16().NotNullable()
            .WithColumn("typicalbody").AsInt16().Nullable()
            .WithColumn("typicaltannins").AsInt16().Nullable()
            .WithColumn("typicalacidity").AsInt16().Nullable()
            .WithColumn("description").AsString(1000).Nullable();
    }

    public override void Down()
    {
        Delete.Table("grapes");
    }
}