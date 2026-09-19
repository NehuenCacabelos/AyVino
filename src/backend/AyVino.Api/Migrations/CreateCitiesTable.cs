using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260809003)]
public class M20260809003_CreateCitiesTable : Migration
{
    public override void Up()
    {
        Create.Table("cities")
            .WithColumn("id").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("name").AsString(100).NotNullable()
            .WithColumn("state_id").AsInt32().NotNullable().ForeignKey("states", "id")
            .WithColumn("status").AsInt16().NotNullable();
    }

    public override void Down()
    {
        Delete.Table("cities");
    }
}