using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260809001)]
public class M20260809001_CreateStatesTable : Migration
{
    public override void Up()
    {
        Create.Table("states")
            .WithColumn("id").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("name").AsString(100).NotNullable();
    }

    public override void Down()
    {
        Delete.Table("states");
    }
}