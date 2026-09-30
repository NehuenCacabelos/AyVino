using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260809004)]
public class M20260809004_CreateLocationsTable : Migration
{
    public override void Up()
    {
        Create.Table("locations")
            .WithColumn("id").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("city_id").AsInt32().NotNullable().ForeignKey("cities", "id");
    }

    public override void Down()
    {
        Delete.Table("locations");
    }
}